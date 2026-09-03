const express = require('express');
const router = express.Router();
const {
  precheckComplaint,
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint
} = require('../controllers/complaintController');

router.post('/precheck', precheckComplaint);

router.route('/')
  .post(createComplaint)
  .get(getAllComplaints);

router.route('/:id')
  .get(getComplaintById)
  .delete(deleteComplaint);

router.route('/:id/status')
  .patch(updateComplaintStatus);

module.exports = router;
