import express from 'express';
import { body, validationResult } from 'express-validator';
import contractService from '../services/contract.service';
import { apiKeyAuth, ownerOnlyAuth } from '../middleware/auth.middleware';
import logger from '../config/logger';

const router = express.Router();

/**
 * @route   GET /api/v1/status
 * @desc    Get contract status (public)
 */
router.get('/status', async (req, res) => {
  try {
    const status = await contractService.getContractStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        humanReadableTimeRemaining: formatTimeRemaining(status.activeTimeRemaining),
        activeUntilDate: new Date(status.activeUntil * 1000).toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error getting contract status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get contract status' 
    });
  }
});

/**
 * @route   GET /api/v1/admin/status
 * @desc    Get detailed contract status (admin only)
 */
router.get('/admin/status', apiKeyAuth, async (req, res) => {
  try {
    const status = await contractService.getContractStatus();
    const owner = await contractService.getContractOwner();
    const isCurrentUserOwner = await contractService.isContractOwner();
    
    res.json({
      success: true,
      data: {
        ...status,
        humanReadableTimeRemaining: formatTimeRemaining(status.activeTimeRemaining),
        activeUntilDate: new Date(status.activeUntil * 1000).toISOString(),
        owner,
        isCurrentUserOwner
      }
    });
  } catch (error: any) {
    logger.error('Error getting admin contract status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get admin contract status' 
    });
  }
});

/**
 * @route   POST /api/v1/admin/pause
 * @desc    Pause the contract
 */
router.post('/admin/pause', ownerOnlyAuth, async (req, res) => {
  try {
    const result = await contractService.pauseContract();
    
    res.json({
      success: true,
      message: 'Contract paused successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error pausing contract:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to pause contract' 
    });
  }
});

/**
 * @route   POST /api/v1/admin/unpause
 * @desc    Unpause the contract
 */
router.post('/admin/unpause', ownerOnlyAuth, async (req, res) => {
  try {
    const result = await contractService.unpauseContract();
    
    res.json({
      success: true,
      message: 'Contract unpaused successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error unpausing contract:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to unpause contract' 
    });
  }
});

/**
 * @route   POST /api/v1/admin/extend
 * @desc    Extend the contract's active timer
 */
router.post(
  '/admin/extend',
  [
    ownerOnlyAuth,
    body('days').isInt({ min: 1 }).withMessage('Days must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const { days } = req.body;
      const result = await contractService.extendActiveTimer(days);
      
      res.json({
        success: true,
        message: `Contract timer extended by ${days} days`,
        data: result
      });
    } catch (error: any) {
      logger.error('Error extending contract timer:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to extend contract timer' 
      });
    }
  }
);

/**
 * @route   POST /api/v1/admin/set-end-date
 * @desc    Set a specific end date for the contract
 */
router.post(
  '/admin/set-end-date',
  [
    ownerOnlyAuth,
    body('timestamp')
      .isInt({ min: Math.floor(Date.now() / 1000) })
      .withMessage('Timestamp must be in the future')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const { timestamp } = req.body;
      const result = await contractService.setActiveTimerEnd(timestamp);
      
      res.json({
        success: true,
        message: `Contract end date set to ${new Date(timestamp * 1000).toISOString()}`,
        data: result
      });
    } catch (error: any) {
      logger.error('Error setting contract end date:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to set contract end date' 
      });
    }
  }
);

/**
 * Format seconds into a human-readable string
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Contract inactive';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
  if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
  if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
  
  return result.trim() || 'Less than a minute';
}

export default router;
