require('dotenv').config()

const connectDatabase = require('../config/db')
const Equipment = require('../models/Equipment')

const equipmentRecords = [
  {
    name: 'Digital Oscilloscope',
    category: 'Electronics',
    assetCode: 'LAB-OSC-001',
    description: 'Two-channel oscilloscope for viewing and measuring electronic signals.',
    status: 'AVAILABLE'
  },
  {
    name: 'Digital Multimeter',
    category: 'Electronics',
    assetCode: 'LAB-DMM-001',
    description: 'Handheld meter for measuring voltage, current, resistance and continuity.',
    status: 'AVAILABLE'
  },
  {
    name: 'Function Generator',
    category: 'Electronics',
    assetCode: 'LAB-FG-001',
    description: 'Signal generator for producing sine, square and triangle waveforms.',
    status: 'AVAILABLE'
  },
  {
    name: 'DC Power Supply',
    category: 'Electronics',
    assetCode: 'LAB-PSU-001',
    description: 'Adjustable bench power supply for safely powering circuit experiments.',
    status: 'AVAILABLE'
  },
  {
    name: 'Arduino Uno',
    category: 'Embedded Systems',
    assetCode: 'LAB-ARD-001',
    description: 'Microcontroller development board for introductory embedded projects.',
    status: 'AVAILABLE'
  },
  {
    name: 'Raspberry Pi 4',
    category: 'Embedded Systems',
    assetCode: 'LAB-RPI-001',
    description: 'Single-board computer for operating system, networking and IoT exercises.',
    status: 'AVAILABLE'
  },
  {
    name: 'ESP32 Development Board',
    category: 'Embedded Systems',
    assetCode: 'LAB-ESP-001',
    description: 'Wi-Fi and Bluetooth microcontroller board for connected device prototypes.',
    status: 'AVAILABLE'
  },
  {
    name: 'Cisco Router',
    category: 'Networking',
    assetCode: 'LAB-RTR-001',
    description: 'Configurable router for practicing IP addressing, routing and network services.',
    status: 'AVAILABLE'
  },
  {
    name: 'Cisco Switch',
    category: 'Networking',
    assetCode: 'LAB-SW-001',
    description: 'Managed network switch for VLAN, switching and cabling laboratory exercises.',
    status: 'AVAILABLE'
  },
  {
    name: 'Logic Analyzer',
    category: 'Electronics',
    assetCode: 'LAB-LA-001',
    description: 'Digital measurement tool for inspecting communication signals and timing.',
    status: 'AVAILABLE'
  },
  {
    name: 'Breadboard Kit',
    category: 'Tools',
    assetCode: 'LAB-BBK-001',
    description: 'Reusable solderless breadboard set with jumper wires for circuit prototyping.',
    status: 'AVAILABLE'
  },
  {
    name: 'Crimping Tool Kit',
    category: 'Tools',
    assetCode: 'LAB-CRP-001',
    description: 'Hand tools and connectors for assembling and testing network cables.',
    status: 'AVAILABLE'
  }
]

async function seedEquipment() {
  let createdCount = 0
  let skippedCount = 0

  for (const equipment of equipmentRecords) {
    const existingEquipment = await Equipment.exists({ assetCode: equipment.assetCode })

    if (existingEquipment) {
      skippedCount += 1
      continue
    }

    await Equipment.create(equipment)
    createdCount += 1
  }

  console.log(`Equipment seed complete: ${createdCount} created, ${skippedCount} skipped`)
}

async function main() {
  try {
    await connectDatabase()
    await seedEquipment()
  } catch (error) {
    console.error('Equipment seed failed')
    process.exitCode = 1
  } finally {
    const mongoose = require('mongoose')
    await mongoose.disconnect()
  }
}

main()
