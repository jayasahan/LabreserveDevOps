const Equipment = require('../models/Equipment')
const Request = require('../models/Request')
const { createRequest } = require('../controllers/requestController')

describe('createRequest', () => {
  let response
  const student = { _id: 'student-id', role: 'STUDENT' }

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('claims available equipment and creates a pending request', async () => {
    const equipment = { _id: 'equipment-id' }
    const request = { _id: 'request-id' }
    const populatedRequest = { ...request, equipment }
    const populate = jest.fn().mockResolvedValue(populatedRequest)

    jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue(equipment)
    jest.spyOn(Request, 'create').mockResolvedValue(request)
    jest.spyOn(Request, 'findById').mockReturnValue({ populate })

    await createRequest(
      { user: student, body: { equipmentId: '507f1f77bcf86cd799439011' } },
      response,
    )

    expect(Equipment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', status: 'AVAILABLE' },
      { $set: { status: 'REQUESTED' } },
      { new: true },
    )
    expect(Request.create).toHaveBeenCalledWith({
      student: student._id,
      equipment: equipment._id,
      status: 'PENDING',
    })
    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.json).toHaveBeenCalledWith({ request: populatedRequest })
  })

  test('rejects a request when another student has already claimed the equipment', async () => {
    jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue(null)
    jest.spyOn(Equipment, 'exists').mockResolvedValue({ _id: 'equipment-id' })
    const createRequestSpy = jest.spyOn(Request, 'create')

    await createRequest(
      { user: student, body: { equipmentId: '507f1f77bcf86cd799439011' } },
      response,
    )

    expect(createRequestSpy).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(409)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Equipment is no longer available.',
    })
  })

  test('rejects an invalid equipment ID before accessing the database', async () => {
    const claimEquipment = jest.spyOn(Equipment, 'findOneAndUpdate')

    await createRequest(
      { user: student, body: { equipmentId: 'not-an-id' } },
      response,
    )

    expect(claimEquipment).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      message: 'A valid equipment ID is required',
    })
  })
})
