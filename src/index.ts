#!/usr/bin/env node

/**
 * N8N MCP Server with HTTP Wrapper
 * Enables Claude to interact with N8N workflows via HTTP API
 */

import express from 'express';
import cors from 'cors';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// N8N API Configuration
const N8N_URL = process.env.N8N_URL || "https://johnpeng4825.zeabur.app";
const N8N_API_KEY = process.env.N8N_API_KEY || "";
const PORT = process.env.PORT || 3000;

// Create N8N API client
class N8NClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  async listWorkflows() {
    const response = await this.client.get("/workflows");
    return response.data;
  }

  async getWorkflow(workflowId: string) {
    const response = await this.client.get(`/workflows/${workflowId}`);
    return response.data;
  }

  async createWorkflow(workflowData: any) {
    const response = await this.client.post("/workflows", workflowData);
    return response.data;
  }

  async updateWorkflow(workflowId: string, workflowData: any) {
    const response = await this.client.put(`/workflows/${workflowId}`, workflowData);
    return response.data;
  }

  async toggleWorkflow(workflowId: string, active: boolean) {
    const response = await this.client.patch(`/workflows/${workflowId}`, { active });
    return response.data;
  }

  async executeWorkflow(workflowId: string, data?: any) {
    const response = await this.client.post(`/workflows/${workflowId}/execute`, data);
    return response.data;
  }

  async getExecution(executionId: string) {
    const response = await this.client.get(`/executions/${executionId}`);
    return response.data;
  }

  async listExecutions(workflowId?: string) {
    const params = workflowId ? { workflowId } : {};
    const response = await this.client.get("/executions", { params });
    return response.data;
  }
}

// Initialize N8N client
const n8nClient = new N8NClient(N8N_URL, N8N_API_KEY);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'n8n-mcp-server',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'N8N MCP Server with HTTP',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'GET /workflows': 'List all workflows',
      'GET /workflows/:id': 'Get workflow details',
      'POST /workflows': 'Create new workflow',
      'PUT /workflows/:id': 'Update workflow',
      'POST /workflows/:id/execute': 'Execute workflow',
      'GET /executions/:id': 'Get execution details',
      'GET /executions': 'List executions'
    }
  });
});

// List workflows
app.get('/workflows', async (req, res) => {
  try {
    const workflows = await n8nClient.listWorkflows();
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get workflow
app.get('/workflows/:id', async (req, res) => {
  try {
    const workflow = await n8nClient.getWorkflow(req.params.id);
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Create workflow
app.post('/workflows', async (req, res) => {
  try {
    const result = await n8nClient.createWorkflow(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Update workflow
app.put('/workflows/:id', async (req, res) => {
  try {
    const result = await n8nClient.updateWorkflow(req.params.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Toggle workflow active state
app.patch('/workflows/:id', async (req, res) => {
  try {
    const { active } = req.body;
    const result = await n8nClient.toggleWorkflow(req.params.id, active);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Execute workflow
app.post('/workflows/:id/execute', async (req, res) => {
  try {
    const result = await n8nClient.executeWorkflow(req.params.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get execution
app.get('/executions/:id', async (req, res) => {
  try {
    const execution = await n8nClient.getExecution(req.params.id);
    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// List executions
app.get('/executions', async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string | undefined;
    const executions = await n8nClient.listExecutions(workflowId);
    res.json(executions);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`N8N MCP HTTP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/`);
  console.log(`Connected to N8N: ${N8N_URL}`);
});
