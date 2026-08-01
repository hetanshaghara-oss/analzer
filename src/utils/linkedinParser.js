export const parseLinkedInCSV = (csvText) => {
  if (!csvText) return [];

  // Simple CSV parser handling quotes
  const lines = [];
  let currentLine = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentVal += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      currentLine.push(currentVal.trim());
      currentVal = '';
    } else if (char === '\n' && !insideQuotes) {
      currentLine.push(currentVal.trim());
      lines.push(currentLine);
      currentLine = [];
      currentVal = '';
    } else if (char !== '\r') {
      currentVal += char;
    }
  }
  
  if (currentVal || currentLine.length > 0) {
    currentLine.push(currentVal.trim());
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Find column indices based on standard LinkedIn export
  const companyIdx = headers.findIndex(h => h.includes('company'));
  const titleIdx = headers.findIndex(h => h.includes('title'));
  const startIdx = headers.findIndex(h => h.includes('started'));
  const endIdx = headers.findIndex(h => h.includes('finished'));
  const descIdx = headers.findIndex(h => h.includes('description'));

  if (companyIdx === -1 || titleIdx === -1) {
    throw new Error("Invalid LinkedIn CSV format. Missing Company or Title columns.");
  }

  const jobs = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 2 || !row[companyIdx]) continue;

    jobs.push({
      company: row[companyIdx] || 'Unknown Company',
      title: row[titleIdx] || 'Employee',
      startDate: row[startIdx] || 'Unknown',
      endDate: row[endIdx] || 'Present',
      description: row[descIdx] || '',
      type: 'linkedin' // To distinguish from GitHub milestones later
    });
  }

  return jobs;
};
