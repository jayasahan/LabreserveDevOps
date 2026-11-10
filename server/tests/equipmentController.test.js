const Equipment = require('../models/Equipment')
const {
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../controllers/equipmentController')

describe('equipmentController', () => {
  let response

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('creates equipment as AVAILABLE regardless of the submitted status', async () => {
    const equipment = { _id: 'equipment-id', status: 'AVAILABLE' }
    const create = jest.spyOn(Equipment, 'create').mockResolvedValue(equipment)

    await createEquipment(
      {
        body: {
          name: 'Oscilloscope',
          category: 'Electronics',
          assetCode: 'SCOPE-001',
          description: 'Digital oscilloscope',
          status: 'BORROWED',
        },
      },
      response,
    )

    expect(create).toHaveBeenCalledWith({
      name: 'Oscilloscope',
      category: 'Electronics',
      assetCode: 'SCOPE-001',
      description: 'Digital oscilloscope',
      status: 'AVAILABLE',
    })
    expect(response.status).toHaveBeenCalledWith(201)
  })

  test('does not allow equipment status to be changed directly', async () => {
    const update = jest.spyOn(Equipment, 'findByIdAndUpdate')

    await updateEquipment(
      {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { status: 'AVAILABLE' },
      },
      response,
    )

    expect(update).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Equipment status is managed by the request workflow',
    })
  })

  test('does not delete equipment that is currently borrowed', async () => {
    jest.spyOn(Equipment, 'findById').mockResolvedValue({
      _id: 'equipment-id',
      status: 'BORROWED',
    })
    const remove = jest.spyOn(Equipment, 'deleteOne')

    await deleteEquipment(
      { params: { id: '507f1f77bcf86cd799439011' } },
      response,
    )

    expect(remove).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(409)
  })
})
