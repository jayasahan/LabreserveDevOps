require('dotenv').config()

const pool = require('../config/mysql')

const equipmentRecords = [
  {
    name: 'Digital Oscilloscope',
    category: 'Electronics',
    assetCode: 'LAB-OSC-001',
    description: 'Two-channel oscilloscope for viewing and measuring electronic signals.'
  },
  {
    name: 'Digital Multimeter',
    category: 'Electronics',
    assetCode: 'LAB-DMM-001',
    description: 'Handheld meter for measuring voltage, current, resistance and continuity.'
  },
  {
    name: 'Function Generator',
    category: 'Electronics',
    assetCode: 'LAB-FG-001',
    description: 'Signal generator for producing sine, square and triangle waveforms.'
  },
  {
    name: 'DC Power Supply',
    category: 'Electronics',
    assetCode: 'LAB-PSU-001',
    description: 'Adjustable bench power supply for safely powering circuit experiments.'
  },
  {
    name: 'Arduino Uno',
    category: 'Embedded Systems',
    assetCode: 'LAB-ARD-001',
    description: 'Microcontroller development board for introductory embedded projects.'
  },
  {
    name: 'Raspberry Pi 4',
    category: 'Embedded Systems',
    assetCode: 'LAB-RPI-001',
    description: 'Single-board computer for operating system, networking and IoT exercises.'
  },
  {
    name: 'ESP32 Development Board',
    category: 'Embedded Systems',
    assetCode: 'LAB-ESP-001',
    description: 'Wi-Fi and Bluetooth microcontroller board for connected device prototypes.'
  },
  {
    name: 'Cisco Router',
    category: 'Networking',
    assetCode: 'LAB-RTR-001',
    description: 'Configurable router for practicing IP addressing, routing and network services.'
  },
  {
    name: 'Cisco Switch',
    category: 'Networking',
    assetCode: 'LAB-SW-001',
    description: 'Managed network switch for VLAN, switching and cabling laboratory exercises.'
  },
  {
    name: 'Logic Analyzer',
    category: 'Electronics',
    assetCode: 'LAB-LA-001',
    description: 'Digital measurement tool for inspecting communication signals and timing.'
  },
  {
    name: 'Breadboard Kit',
    category: 'Tools',
    assetCode: 'LAB-BBK-001',
    description: 'Reusable solderless breadboard set with jumper wires for circuit prototyping.'
  },
  {
    name: 'Crimping Tool Kit',
    category: 'Tools',
    assetCode: 'LAB-CRP-001',
    description: 'Hand tools and connectors for assembling and testing network cables.'
  }
]

async function seedEquipment() {
  let createdCount = 0
  let skippedCount = 0

  for (const equipment of equipmentRecords) {
    const [existingEquipment] = await pool.execute(
      'SELECT id FROM equipment WHERE asset_code = ?',
      [equipment.assetCode]
    )

    if (existingEquipment.length > 0) {
      skippedCount += 1
      continue
    }

    try {
      await pool.execute(
        "INSERT INTO equipment (name, category, asset_code, description, status) VALUES (?, ?, ?, ?, 'AVAILABLE')",
        [equipment.name, equipment.category, equipment.assetCode, equipment.description]
      )
      createdCount += 1
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        skippedCount += 1
        continue
      }

      throw error
    }
  }

  console.log(`Equipment seed complete: ${createdCount} created, ${skippedCount} skipped`)
}

async function main() {
  try {
    await seedEquipment()
  } catch (error) {
    console.error('Equipment seed failed')
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
