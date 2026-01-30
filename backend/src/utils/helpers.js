const ExcelJS = require('exceljs');

/**
 * Generate CSV from data
 */
const generateCSV = (data, headers) => {
  const headerRow = headers.join(',');
  const dataRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generate XLSX Buffer from data
 */
const generateXLSX = async (data, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = Math.min(cellLength, 50);
        }
      });
      column.width = maxLength + 2;
    });
  }

  return await workbook.xlsx.writeBuffer();
};

/**
 * Format evaluation data for export
 */
const formatEvaluationData = (teams) => {
  return teams.map((team, index) => ({
    'S.No': index + 1,
    'Team Name': team.name,
    'Members': team.members
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.user?.fullName || 'Unknown')
      .join(', '),
    'Member Count': team.activeMemberCount,
    'Marks': team.evaluation?.marks ?? 'Not Evaluated',
    'Remarks': team.evaluation?.remarks || '',
    'Evaluated By': team.evaluation?.evaluatedBy?.fullName || '',
    'Evaluated At': team.evaluation?.evaluatedAt
      ? new Date(team.evaluation.evaluatedAt).toLocaleDateString()
      : '',
    'Status': team.evaluation?.isLocked ? 'Locked' : 'Pending',
    'Submission Status': team.submission?.status || 'NOT_SUBMITTED',
  }));
};

/**
 * Parse pagination parameters
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Parse sort parameters
 */
const parseSort = (query, allowedFields = ['createdAt']) => {
  const sortField = allowedFields.includes(query.sortBy)
    ? query.sortBy
    : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return { [sortField]: sortOrder };
};

/**
 * Sanitize string for search
 */
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Generate random code
 */
const generateCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Generate invite token
 */
const generateInviteToken = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

module.exports = {
  generateCSV,
  generateXLSX,
  formatEvaluationData,
  parsePagination,
  parseSort,
  sanitizeSearchQuery,
  generateCode,
  generateInviteToken,
};
