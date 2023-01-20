const multer = require("multer");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const parseString = require("xml2js").parseString;
const sql = require("../models/db.js");
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// File upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/");
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + file.originalname);
  },
});
const imageFilter = function (req, file, cb) {
  // Accept images only
  if (
    !file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|svg|SVG)$/)
  ) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

exports.fileupload = (req, res) => {
  let upload = multer({ storage: storage, fileFilter: imageFilter }).single(
    "file"
  );

  upload(req, res, function (err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any
    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    } else if (!req.file) {
      return res.send("Please select an image to upload");
    } else if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }

    // Display uploaded image for user validation
    res.send({
      path: `upload/${req.file.fieldname}-${req.file.originalname}`,
    });
  });
};

exports.checkout = async (req, res) => {
  const amount = req.body.amount;
  const returnUrl = req.body.link;
  const name = req.body.name;
  const userInfo = JSON.parse(req.body.userInfo);
  const currencyCode = req.body.currency ? req.body.currency : "NOK";

  const order = {
    order: {
      items: [
        {
          reference: name,
          name: name,
          quantity: 1,
          unit: "order",
          unitPrice: amount,
          grossTotalAmount: amount,
          netTotalAmount: amount,
        },
      ],
      amount: amount,
      currency: currencyCode,
      reference: name,
    },
    checkout: {
      returnUrl: `${process.env.SERVER_URL}${returnUrl}`,
      termsUrl: `${process.env.SERVER_URL}/toc`,
      integrationType: "HostedPaymentPage",
      merchantHandlesConsumerData: true,
      consumer: {
        reference: userInfo["name"],
        email: userInfo["email"],
        shippingAddress: {
          addressLine1: "Toodels street 1",
          addressLine2: "Co/ John",
          postalCode: "0045",
          city: "OSLO",
          country: "NOR",
        },
        phoneNumber: {
          prefix: "+47",
          number: userInfo["mobile_number"].split("47")[1],
        },
        privatePerson: {
          firstName: userInfo["name"].split(" ")[0],
          lastName: userInfo["name"].split(" ")[1],
        },
      },
    },
  };

  try {
    const response = await axios.post(process.env.NETS_API_URL, order, {
      headers: {
        Authorization: process.env.NETS_SECRET_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    if (response.status == 201) {
      res.send(response.data.paymentId);
    } else {
      res.status(400).send({ message: "Nets Easy payment failed" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: "Nets Easy payment failed" });
  }
};

exports.registerTreatment = (req, res) => {
  sql.connect((error) => {
    if (error) return res.status(500).send(error);
    console.log("Successfully connected to the database.");
    const d = new Date();
    const dateString = d.toString();

    sql.query(
      "INSERT INTO customer SET name = ?, email = ?, mobile = ?, birthday = ?, treatment = ?, type = ?, date = ?",
      [
        req.body.name,
        req.body.email,
        req.body.mobile_number,
        req.body.birthday,
        req.body.treatment,
        req.body.treatmentType,
        dateString,
      ],
      function (err, rows) {
        if (err) return res.status(500).send(err);
        return res.send({ id: rows.insertId });
      }
    );
  });
};

exports.customers = (req, res) => {
  sql.connect((error) => {
    if (error) return res.status(500).send(error);
    console.log("Successfully connected to the database.");
    const d = new Date();
    const dateString = d.toString();

    sql.query("SELECT * FROM customer", function (err, rows) {
      if (err) return res.status(500).send(err);
      return res.send({ ...rows });
    });
  });
};

// Delete a customer by ID
exports.delete = (req, res) => {
  // Validate request
  if (!req.body) {
    // Unique validation needed
    res.status(400).send({
      message: "Content can not be empty!",
    });
  }

  sql.connect((error) => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");

    sql.query(
      "DELETE FROM customer WHERE id = ?",
      [req.body.customerId],
      function (err, result) {
        if (err) res.status(500).send(err);
        res.send({ ...result });
      }
    );
  });
};

// Send an email
exports.sendEmail = (req, res) => {
  sql.connect((error) => {
    if (error) return res.status(500).send(error);
    console.log("Successfully connected to the database.");

    sql.query(
      `SELECT * FROM customer WHERE id = ${req.params.id}`,
      function (err, row) {
        if (err) return res.status(500).send(err);
        const msg = {
          to: row[0].email,
          from: "admin@nettleger.no",
          subject: "Din henvendelse er nå under behandling",
          html: `<p>Hei ${row[0].name},</p><p>Våre leger behandler din hendvendelse.
          </p><p>Vi vil ta kontakt med deg i løpet av kort tid.</p><p>Takk!</p><p>Mvh,</p><a href="https://nettleger.no">nettleger.no</a>`,
        };
        sgMail.send(msg)
        .then((response) => {
          return res.status(response[0].statusCode).send({ msg: response[0].headers });
        })
        .catch((error) => {
          return res.status(500).send({ msg: error });
        })
      }
    );
  });
};
