const express = require('express')
const requestController = require('../controllers/requestController')
const requireAuthentication = require('../middleware/authMiddleware')
const requireAdmin = require('../middleware/adminMiddleware')

const router = express.Router()

router.use(requireAuthentication)
router.post('/', requestController.createRequest)
router.get('/my', requestController.getMyRequests)
router.patch('/:id/cancel', requestController.cancelRequest)
router.get('/', requireAdmin, requestController.getAllRequests)
router.patch('/:id/approve', requireAdmin, requestController.approveRequest)
router.patch('/:id/reject', requireAdmin, requestController.rejectRequest)
router.patch('/:id/return', requireAdmin, requestController.returnRequest)

module.exports = router
