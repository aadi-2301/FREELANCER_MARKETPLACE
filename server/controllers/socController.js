import { queryAll, queryGet } from '../database/db.js';
import { verifyAuditLogChain } from '../middleware/auditLogger.js';

export const getSocMetrics = async (req, res) => {
  try {
    const totalLogs = await queryGet('SELECT COUNT(*) as count FROM audit_logs');
    const severityCounts = await queryAll('SELECT severity, COUNT(*) as count FROM audit_logs GROUP BY severity');
    const eventCounts = await queryAll('SELECT event_type, COUNT(*) as count FROM audit_logs GROUP BY event_type ORDER BY count DESC LIMIT 8');

    const totalOrders = await queryGet('SELECT COUNT(*) as count, SUM(amount) as volume FROM orders');
    const escrowLocked = await queryGet("SELECT COUNT(*) as count, SUM(amount) as volume FROM orders WHERE status = 'escrow_locked'");
    const totalUsers = await queryGet('SELECT COUNT(*) as count FROM users');
    const quarantinedFiles = await queryGet("SELECT COUNT(*) as count FROM deliverables WHERE scan_status = 'quarantined'");

    const chainStatus = await verifyAuditLogChain();

    const severityMap = { INFO: 0, WARN: 0, HIGH: 0, CRITICAL: 0 };
    severityCounts.forEach(r => {
      severityMap[r.severity] = r.count;
    });

    res.json({
      metrics: {
        totalAuditEvents: totalLogs.count,
        severityBreakdown: severityMap,
        blockedAttacks: (severityMap.HIGH || 0) + (severityMap.CRITICAL || 0),
        quarantinedFiles: quarantinedFiles.count,
        totalEscrowVolume: totalOrders.volume || 0,
        currentlyLockedEscrow: escrowLocked.volume || 0,
        totalUsers: totalUsers.count,
        topEvents: eventCounts,
        chainIntegrity: chainStatus.valid ? 'VALID_SECURE' : 'COMPROMISED',
        chainDetails: chainStatus.message
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getSocLogs = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const severity = req.query.severity;

    let sql = 'SELECT * FROM audit_logs';
    const params = [];

    if (severity && severity !== 'ALL') {
      sql += ' WHERE severity = ?';
      params.push(severity);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const logs = await queryAll(sql, params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
