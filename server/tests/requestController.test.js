const Equipment = require('../models/Equipment')
const Request = require('../models/Request')
const {
  createRequest,
  cancelRequest,
  approveRequest,
  rejectRequest,
  returnRequest,
} = require('../controllers/requestController')

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

  test('releases claimed equipment if creating the request fails', async () => {
    const equipment = { _id: 'equipment-id' }
    jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue(equipment)
    jest.spyOn(Request, 'create').mockRejectedValue(new Error('Database error'))
    const releaseEquipment = jest.spyOn(Equipment, 'updateOne').mockResolvedValue({})

    await createRequest(
      { user: student, body: { equipmentId: '507f1f77bcf86cd799439011' } },
      response,
    )

    expect(releaseEquipment).toHaveBeenCalledWith(
      { _id: equipment._id, status: 'REQUESTED' },
      { $set: { status: 'AVAILABLE' } },
    )
    expect(response.status).toHaveBeenCalledWith(500)
  })
})

describe('cancelRequest', () => {
  let response
  const student = { _id: 'student-id', role: 'STUDENT' }
  const requestId = '507f1f77bcf86cd799439011'

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("cancels the student's pending request and makes its equipment available", async () => {
    const request = {
      _id: requestId,
      student: student._id,
      equipment: 'equipment-id',
      status: 'PENDING',
    }
    const cancelledRequest = { ...request, status: 'CANCELLED' }
    const populatedRequest = { ...cancelledRequest, equipment: { name: 'Oscilloscope' } }
    jest.spyOn(Request, 'findById')
      .mockResolvedValueOnce(request)
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(populatedRequest),
      })
    const releaseEquipment = jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue({})
    const updateRequest = jest.spyOn(Request, 'findOneAndUpdate').mockResolvedValue(cancelledRequest)

    await cancelRequest({ user: student, params: { id: requestId } }, response)

    expect(releaseEquipment).toHaveBeenCalledWith(
      { _id: request.equipment, status: 'REQUESTED' },
      { $set: { status: 'AVAILABLE' } },
      { new: true },
    )
    expect(updateRequest).toHaveBeenCalledWith(
      { _id: requestId, student: student._id, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } },
      { new: true },
    )
    expect(response.json).toHaveBeenCalledWith({ request: populatedRequest })
  })

  test("does not cancel another student's request", async () => {
    jest.spyOn(Request, 'findById').mockResolvedValue({
      _id: requestId,
      student: 'another-student',
      equipment: 'equipment-id',
      status: 'PENDING',
    })
    const releaseEquipment = jest.spyOn(Equipment, 'findOneAndUpdate')

    await cancelRequest({ user: student, params: { id: requestId } }, response)

    expect(releaseEquipment).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(403)
  })
})

describe.each([
  ['approveRequest', 'APPROVED', 'BORROWED'],
  ['rejectRequest', 'REJECTED', 'AVAILABLE'],
])('%s', (actionName, nextRequestStatus, nextEquipmentStatus) => {
  let response
  const requestId = '507f1f77bcf86cd799439011'

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test(`changes request to ${nextRequestStatus} and equipment to ${nextEquipmentStatus}`, async () => {
    const request = {
      _id: requestId,
      status: 'PENDING',
      equipment: { _id: 'equipment-id', status: 'REQUESTED' },
    }
    const updatedRequest = { ...request, status: nextRequestStatus }
    jest.spyOn(Request, 'findById')
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(request) })
      .mockReturnValueOnce({ populate: jest.fn().mockReturnThis() })
    const updateEquipment = jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue({})
    const updateRequest = jest.spyOn(Request, 'findOneAndUpdate').mockResolvedValue(updatedRequest)

    const action = { approveRequest, rejectRequest }[actionName]
    await action({ params: { id: requestId } }, response)

    expect(updateEquipment).toHaveBeenCalledWith(
      { _id: request.equipment._id, status: 'REQUESTED' },
      { $set: { status: nextEquipmentStatus } },
      { new: true },
    )
    expect(updateRequest).toHaveBeenCalledWith(
      { _id: requestId, status: 'PENDING' },
      { $set: { status: nextRequestStatus } },
      { new: true },
    )
    expect(response.json).toHaveBeenCalled()
  })
})

describe('returnRequest', () => {
  let response
  const requestId = '507f1f77bcf86cd799439011'

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('marks an approved request returned and makes the equipment available', async () => {
    const request = {
      _id: requestId,
      status: 'APPROVED',
      equipment: { _id: 'equipment-id', status: 'BORROWED' },
    }
    const returnedRequest = { ...request, status: 'RETURNED' }
    jest.spyOn(Request, 'findById')
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(request) })
      .mockReturnValueOnce({ populate: jest.fn().mockReturnThis() })
    const updateEquipment = jest.spyOn(Equipment, 'findOneAndUpdate').mockResolvedValue({})
    const updateRequest = jest.spyOn(Request, 'findOneAndUpdate').mockResolvedValue(returnedRequest)

    await returnRequest({ params: { id: requestId } }, response)

    expect(updateEquipment).toHaveBeenCalledWith(
      { _id: request.equipment._id, status: 'BORROWED' },
      { $set: { status: 'AVAILABLE' } },
      { new: true },
    )
    expect(updateRequest).toHaveBeenCalledWith(
      { _id: requestId, status: 'APPROVED' },
      { $set: { status: 'RETURNED' } },
      { new: true },
    )
    expect(response.json).toHaveBeenCalled()
  })
})
