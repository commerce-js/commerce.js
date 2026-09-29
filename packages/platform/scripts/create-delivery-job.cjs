// Create delivery job via Armada API — v2 with explicit output
// Set ARMADA_API_KEY in the environment; never commit credentials.

async function main() {
  const token = process.env.ARMADA_API_KEY
  if (!token) {
    throw new Error('ARMADA_API_KEY is not set')
  }

  process.stdout.write('Token: ' + token.substring(0, 15) + '...\n')

  const payload = {
    reference: 'CJS-ORDER-' + Date.now(),
    origin_format: 'branch_format',
    origin: { branch_id: '687e63052457a10038d739ff' },
    destination_format: 'location_format',
    destination: {
      contact_name: 'Baker',
      contact_phone: '+97339876543',
      latitude: 26.2235,
      longitude: 50.5876,
      first_line: 'Juffair, Block 338, Building 1234',
      instructions: 'Ring doorbell'
    },
    payment: {
      type: 'paid',
      amount: 5.00
    }
  }

  process.stdout.write('Creating delivery with payload:\n')
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n')

  const res = await fetch('https://api.armadadelivery.com/v1/deliveries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Armada-Access-Token': token
    },
    body: JSON.stringify(payload)
  })

  const text = await res.text()
  process.stdout.write('HTTP ' + res.status + '\n')
  process.stdout.write(text + '\n')
}

main().catch(e => { process.stdout.write('ERROR: ' + e.message + '\n'); process.exit(1) })
