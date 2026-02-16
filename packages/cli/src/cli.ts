#!/usr/bin/env node
// ---------------------------------------------------------------------------
// CommerceJS CLI — entry point
// ---------------------------------------------------------------------------

import { defineCommand, runMain } from 'citty'
import { deployCommand } from './commands/deploy.js'
import { initCommand } from './commands/init.js'
import { envCommand } from './commands/env.js'

const main = defineCommand({
  meta: {
    name: 'commercejs',
    version: '0.1.0',
    description: 'CommerceJS CLI — deploy, init, and manage commerce stores',
  },
  subCommands: {
    deploy: deployCommand,
    init: initCommand,
    env: envCommand,
  },
})

runMain(main)
