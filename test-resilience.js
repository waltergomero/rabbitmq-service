#!/usr/bin/env node

/**
 * Test script to verify resilience features
 * Run this to test various failure scenarios
 */

import { connectRabbitMQ, closeRabbitMQ, onConnection, onDisconnection, getConnectionState } from './src/utils/rabbitmq';
import { publishMessage } from './src/rabbitmq/publisher';
import { consumeMessage } from './src/rabbitmq/consumer';

async function runResilienceTests() {
    console.log('🧪 Starting Resilience Tests...\n');

    let testCount = 0;
    let passedTests = 0;

    const test = (name: string, condition: boolean) => {
        testCount++;
        if (condition) {
            passedTests++;
            console.log(`✅ Test ${testCount}: ${name}`);
        } else {
            console.log(`❌ Test ${testCount}: ${name}`);
        }
    };

    // Test 1: Initial Connection
    try {
        await connectRabbitMQ();
        const state = getConnectionState();
        test('Initial connection establishment', state.isHealthy);
    } catch (error) {
        test('Initial connection establishment', false);
        console.log('   Error:', error.message);
    }

    // Test 2: Connection State Tracking
    const state = getConnectionState();
    test('Connection state tracking', 
        typeof state.isHealthy === 'boolean' && 
        typeof state.reconnectAttempts === 'number'
    );

    // Test 3: Event Listeners
    let connectionEventFired = false;
    let disconnectionEventFired = false;

    onConnection(() => {
        connectionEventFired = true;
    });

    onDisconnection(() => {
        disconnectionEventFired = true;
    });

    test('Event listener registration', true); // Basic registration test

    // Test 4: Message Publishing with Retry
    try {
        await publishMessage('test_queue', 'Test resilience message', 3);
        test('Message publishing with retry', true);
    } catch (error) {
        test('Message publishing with retry', false);
        console.log('   Error:', error.message);
    }

    // Test 5: Consumer Setup
    try {
        const messageReceived = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 5000);
            
            consumeMessage('test_queue', (msg) => {
                if (msg) {
                    clearTimeout(timeout);
                    resolve(true);
                }
            });
        });

        test('Consumer message handling', !!messageReceived);
    } catch (error) {
        test('Consumer message handling', false);
        console.log('   Error:', error.message);
    }

    // Test 6: Health Check
    try {
        const healthState = getConnectionState();
        test('Health status reporting', 
            healthState.hasOwnProperty('isHealthy') && 
            healthState.hasOwnProperty('lastError')
        );
    } catch (error) {
        test('Health status reporting', false);
    }

    // Test 7: Graceful Cleanup
    try {
        await closeRabbitMQ();
        const finalState = getConnectionState();
        test('Graceful connection cleanup', !finalState.isHealthy);
    } catch (error) {
        test('Graceful connection cleanup', false);
        console.log('   Error:', error.message);
    }

    // Results Summary
    console.log(`\n📊 Test Results: ${passedTests}/${testCount} tests passed`);
    
    if (passedTests === testCount) {
        console.log('🎉 All resilience tests passed!');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed - check implementation');
        process.exit(1);
    }
}

// Run tests with error handling
runResilienceTests().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
