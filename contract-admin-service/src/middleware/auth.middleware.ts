import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../config/logger';
import contractService from '../services/contract.service';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey || apiKey !== config.apiKey) {
      logger.warn(`Unauthorized access attempt: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Invalid API key' 
      });
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
}

export async function ownerOnlyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // First check API key
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || apiKey !== config.apiKey) {
      logger.warn(`Unauthorized access attempt: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Invalid API key' 
      });
    }

    // Then check if the caller has owner permissions on the contract
    const isOwner = await contractService.isContractOwner();
    if (!isOwner) {
      logger.warn(`Non-owner attempting restricted operation: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Current signer is not the contract owner'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Owner authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during owner authentication' 
    });
  }
}
