const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Adjust DB connection here if needed
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hardwareforge'
});

router.post('/check-compatibility', async (req, res) => {
  const {
    cpus_id,
    motherboards_id,
    rams_id,
    gpus_id,
    psus_id,
    cases_id,
    cpucoolers_id
  } = req.body;

  try {
    const issues = [];

    const [cpuRows] = cpus_id ? await db.query('SELECT * FROM cpus WHERE id = ?', [cpus_id]) : [[]];
    const [moboRows] = motherboards_id ? await db.query('SELECT * FROM motherboards WHERE id = ?', [motherboards_id]) : [[]];
    const [ramRows] = rams_id ? await db.query('SELECT * FROM rams WHERE id = ?', [rams_id]) : [[]];
    const [gpuRows] = gpus_id ? await db.query('SELECT * FROM gpus WHERE id = ?', [gpus_id]) : [[]];
    const [psuRows] = psus_id ? await db.query('SELECT * FROM psus WHERE id = ?', [psus_id]) : [[]];
    const [caseRows] = cases_id ? await db.query('SELECT * FROM cases WHERE id = ?', [cases_id]) : [[]];
    const [coolerRows] = cpucoolers_id ? await db.query('SELECT * FROM cpucoolers WHERE id = ?', [cpucoolers_id]) : [[]];

    const cpu = cpuRows[0];
    const mobo = moboRows[0];
    const ram = ramRows[0];
    const gpu = gpuRows[0];
    const psu = psuRows[0];
    const pcCase = caseRows[0];
    const cooler = coolerRows[0];

    // --- Compatibility checks ---
    if (cpu && mobo && cpu.socket && mobo.CPU && cpu.socket !== mobo.CPU)
      issues.push(`CPU socket (${cpu.socket}) does not match motherboard socket (${mobo.CPU})`);

    if (ram && mobo && ram.type && mobo.ram_type && ram.type !== mobo.ram_type)
      issues.push(`RAM type (${ram.type}) not supported by motherboard (${mobo.ram_type})`);

    if (psu && gpu && psu.wattage && gpu.power_draw && psu.wattage < gpu.power_draw + 200)
      issues.push(`PSU wattage (${psu.wattage}W) too low for GPU (${gpu.power_draw}W)`);

    if (pcCase && gpu && pcCase.max_gpu_length && gpu.length && gpu.length > pcCase.max_gpu_length)
      issues.push(`GPU length (${gpu.length}mm) exceeds case limit (${pcCase.max_gpu_length}mm)`);

    if (pcCase && cooler && pcCase.max_cooler_height && cooler.height && cooler.height > pcCase.max_cooler_height)
      issues.push(`Cooler height (${cooler.height}mm) exceeds case limit (${pcCase.max_cooler_height}mm)`);

    const compatible = issues.length === 0;
    res.json({ compatible, issues });

  } catch (err) {
    console.error('Compatibility check error:', err);
    res.status(500).json({ error: 'Server error during compatibility check' });
  }
});

module.exports = router;
