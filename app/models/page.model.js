const sql = require("./db.js");

// constructor
const Page = function(page) {
	return page;
};

Page.create = async (request, response) => {
  // open the MySQL connection
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");
    const d = new Date();
    const dateString = d.toString();
    sql.query("INSERT INTO page SET name = ?, slug = ?, meta_title = ?, meta_description = ?, type = ?, sections = ?, date = ?, status = ?, page_content = ? ",
      [request.name,
       request.slug ? request.slug : request.name.toLowerCase(),
       request.meta_title,
       request.meta_description,
       request.type ? request.type : 'single',
       request.sections ? JSON.stringify(request.sections) : null,
       dateString,
       0,
       request.page_content ? JSON.stringify(request.page_content) : null
      ],
      function (err, rows) {
        if (err) response(err, null);
        response(null, {id: rows.insertId});
      }
    );
  });
};

Page.getById = async (request, response) => {
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");

    sql.query("SELECT * FROM page WHERE id = ?", [request.pageId], function (err, result ) {
      if (err) response(err, null);
      response(null, { ...result[0] });
    });
  });
};

function getAllSlugs () {
  return new Promise((resolve, reject) => {
    sql.query("SELECT slug, name FROM page", function (err, rows ) {
      if (err) reject(err);
      resolve(rows);
    });
  });
}
function getAllModules() {
 return new Promise((resolve, reject) => {
    sql.query("SELECT id, name FROM module", function (err, rows ) {
      if (err) reject(err);
      resolve(rows);
    });
  }); 
}
function getAllTreatments() {
 return new Promise((resolve, reject) => {
    sql.query("SELECT id, name, link, card_cost, card_description FROM treatment", function (err, rows ) {
      if (err) reject(err);
      resolve(rows);
    });
  });
}
function getAllCovids() {
 return new Promise((resolve, reject) => {
    sql.query("SELECT id, name, description, link, cost, btnName FROM covid", function (err, rows ) {
      if (err) reject(err);
      resolve(rows);
    });
  });
}
Page.getBySlug = async (request, response) => {
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");
    sql.query("SELECT * FROM page WHERE slug = ?", [request.slug], async function (err, result ) {
      if (err) response(err, null);
      const slugs = await getAllSlugs();
      const modules = await getAllModules();
      const treatments = await getAllTreatments();
      const covids = await getAllCovids();
      response(null, { slugs, modules, treatments, covids, model_type: result[0] ? 'page' : '404', ...result[0] });
    });
  });
};

Page.getAll = async (request, response) => {
  // open the MySQL connection
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");
    
    sql.query("SELECT * FROM page", function (err, result) {
      if (err) response(err, null);
      response(null, {...result});
    });
  });
};

Page.update = async (request, response) => {
  const { id, data } = request;
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");
    const d = new Date();
    const dateString = d.toString();
    sql.query("UPDATE page SET name = ?, slug = ?, meta_title = ?, meta_description = ?, type = ?, sections = ?, date = ?, status = ?, page_content = ? WHERE id = ? ",
      [data.name,
       data.slug ? data.slug : data.name.toLowerCase(),
       data.meta_title,
       data.meta_description,
       data.type ? data.type : 'single',
       data.sections ? JSON.stringify(data.sections) : null,
       dateString,
       0,
       data.page_content ? JSON.stringify(data.page_content) : null,
       id
      ],
      function (err, result) {
        if (err) response(err, null);
        response(null, {...result});
      }
    );
  });
};

Page.duplicate = async (request, response) => {
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");
    
    // Get a page by id
    sql.query("SELECT * FROM page WHERE id = ?", [request.pageId], function (err, result ) {
      if (err) response(err, null);
      let currentPage = result[0];
      // Create a page
      const d = new Date();
      const dateString = d.toString();
      sql.query("INSERT INTO page SET name = ?, slug = ?, meta_title = ?, meta_description = ?, type = ?, sections = ?, date = ?, status = ?, page_content = ? ",
        [currentPage.name + '_copy',
          currentPage.slug + '_copy',
          currentPage.meta_title,
          currentPage.meta_description,
          currentPage.type,
          currentPage.sections,
        dateString,
        0,
        currentPage.page_content
        ],
        function (err, rows) {
          if (err) response(err, null);
          response(null, {id: rows.insertId});
        }
      );
    });
  });
};

Page.delete = async (request, response) => {
  sql.connect(error => {
    if (error) response(error, null);
    console.log("Successfully connected to the database.");

    sql.query("DELETE FROM page WHERE id = ?", [request.pageId], function (err, result ) {
      if (err) response(err, null);
      response(null, { ...result });
    });
  });
};

module.exports = Page;
