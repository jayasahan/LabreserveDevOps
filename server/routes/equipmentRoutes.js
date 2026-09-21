const express = require('express')
const equipmentController = require('../controllers/equipmentController')
const requireAuthentication = require('../middleware/authMiddleware')
const requireAdmin = require('../middleware/adminMiddleware')

const router = express.Router()

router.use(requireAuthentication)
router.get('/', equipmentController.getEquipment)
router.get('/:id', equipmentController.getEquipmentById)
router.post('/', requireAdmin, equipmentController.createEquipment)
router.put('/:id', requireAdmin, equipmentController.updateEquipment)
router.delete('/:id', requireAdmin, equipmentController.deleteEquipment)

module.exports = router
