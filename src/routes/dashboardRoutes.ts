import express from 'express';
import { Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoleDashboard } from '../middleware/roleAuth.js';
import { AuthRequest } from '../controllers/authController.js';
import prisma from '../config/database.js';

const router = express.Router();

/**
 * Shared app pages - accessible to all authenticated users
 */
router.get('/shared', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'This is a shared page accessible to all authenticated users',
      user: {
        id: req.user?.userId,
        loginId: req.user?.loginId,
        role: req.user?.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Stockist dashboard - only accessible to STOCKIST role
 */
router.get(
  '/stockist',
  authenticate,
  requireRoleDashboard('STOCKIST'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get stockist's orders
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { supplierId: userId },
          ],
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      res.json({
        success: true,
        message: 'Stockist dashboard',
        data: {
          orders,
          totalOrders: orders.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Distributor dashboard - only accessible to DISTRIBUTOR role
 */
router.get(
  '/distributor',
  authenticate,
  requireRoleDashboard('DISTRIBUTOR'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get distributor's orders
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { supplierId: userId },
          ],
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      res.json({
        success: true,
        message: 'Distributor dashboard',
        data: {
          orders,
          totalOrders: orders.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Retailer dashboard - only accessible to RETAILER role
 */
router.get(
  '/retailer',
  authenticate,
  requireRoleDashboard('RETAILER'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get retailer's orders (as buyer)
      const orders = await prisma.order.findMany({
        where: {
          buyerId: userId,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          salesperson: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      res.json({
        success: true,
        message: 'Retailer dashboard',
        data: {
          orders,
          totalOrders: orders.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Salesperson dashboard - only accessible to SALESPERSON role
 */
router.get(
  '/salesperson',
  authenticate,
  requireRoleDashboard('SALESPERSON'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get orders created by this salesperson
      const orders = await prisma.order.findMany({
        where: {
          salespersonId: userId,
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              loginId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      res.json({
        success: true,
        message: 'Salesperson dashboard',
        data: {
          orders,
          totalOrders: orders.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

export default router;
