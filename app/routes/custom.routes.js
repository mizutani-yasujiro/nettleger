const express = require('express');
const router = express.Router();

const controller = require("../controllers/custom.controller.js");
const { route } = require('./user.routes.js');

router.route('/fileupload').post(controller.fileupload);
router.route('/checkout').post(controller.checkout);
router.route('/registerTreatment').post(controller.registerTreatment);
router.route('/customers').get(controller.customers);
router.route('/delete').post(controller.delete);
router.route('/:id/sendEmail').get(controller.sendEmail);
module.exports = router;