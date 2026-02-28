"use client";

import { useState, useCallback } from "react";

type CellData = {
  value: string;
  formula?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
  };
};

// Formula evaluation function
function evaluateFormula(formula: string, gridData: GridData): string {
  // Check if it starts with =
  if (!formula.startsWith("=")) {
    return formula;
  }

  // Remove the = and get the expression
  const expression = formula.substring(1).trim();
  
  // Match cell references (e.g., A1, B2, etc.)
  const cellRefRegex = /([A-J])(\d{1,2})/g;
  
  // Replace cell references with their numeric values
  let parsedExpression = expression.replace(cellRefRegex, (match, col, row) => {
    const cellId = `${col}${parseInt(row)}`;
    const cellData = gridData[cellId];
    
    if (!cellData) {
      return "0";
    }
    
    // If the referenced cell also has a formula, evaluate it recursively
    const value = cellData.formula ? evaluateFormula(cellData.formula, gridData) : cellData.value;
    
    // Parse the value as a number
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "0" : numValue.toString();
  });

  // Support basic arithmetic operations: +, -, *, /
  // Validate the expression contains only numbers, operators, and parentheses
  if (!/^[\d\s+\-*/().]+$/.test(parsedExpression)) {
    return formula; // Return formula if invalid
  }

  try {
    // Use Function constructor for safe evaluation
    const result = new Function(`return ${parsedExpression}`)();
    
    // Check if result is a valid number
    if (typeof result === "number" && !isNaN(result)) {
      // Format result: show integers without decimals, decimals with max 2 places
      return Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(2)).toString();
    }
    return formula;
  } catch {
    return formula; // Return formula if evaluation fails
  }
}

type GridData = Record<string, CellData>;

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ROWS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function Spreadsheet() {
  const [gridData, setGridData] = useState<GridData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [lastSelectedCell, setLastSelectedCell] = useState<string | null>(null);
  
  // Mouse drag selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<string | null>(null);

  // Handle format buttons (bold, italic, underline, alignment, clear)
  const handleFormat = useCallback((formatType: string) => {
    if (!selectedCell) return;

    setGridData(prev => {
      const newGrid = { ...prev };
      const cellsToFormat = selectedCells.size > 0 ? Array.from(selectedCells) : [selectedCell];
      
      cellsToFormat.forEach(cellId => {
        const currentCell = prev[cellId] || { value: "" };
        const currentFormat = currentCell.format || {};
        
        if (formatType === 'clear') {
          // Clear cell content and format
          delete newGrid[cellId];
        } else if (formatType === 'bold') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, bold: !currentFormat.bold }
          };
        } else if (formatType === 'italic') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, italic: !currentFormat.italic }
          };
        } else if (formatType === 'underline') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, underline: !currentFormat.underline }
          };
        } else if (formatType === 'alignLeft') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, align: 'left' }
          };
        } else if (formatType === 'alignCenter') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, align: 'center' }
          };
        } else if (formatType === 'alignRight') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, align: 'right' }
          };
        }
      });
      
      return newGrid;
    });
  }, [selectedCell, selectedCells]);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  // Helper function to parse cell ID
  const parseCellId = (cellId: string) => {
    const col = cellId.charAt(0);
    const row = parseInt(cellId.substring(1));
    return { col, row };
  };

  // Helper function to get all cells in a range
  const getCellRange = (startCellId: string, endCellId: string): string[] => {
    const start = parseCellId(startCellId);
    const end = parseCellId(endCellId);
    const cells: string[] = [];
    
    const startColIndex = COLUMNS.indexOf(start.col);
    const endColIndex = COLUMNS.indexOf(end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minColIndex = Math.min(startColIndex, endColIndex);
    const maxColIndex = Math.max(startColIndex, endColIndex);
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
        cells.push(getCellId(COLUMNS[colIndex], row));
      }
    }
    return cells;
  };

  // Handle mouse down - start drag selection
  const handleMouseDown = useCallback((cellId: string) => {
    setIsDragging(true);
    setDragStartCell(cellId);
    setSelectedCell(cellId);
    setSelectedCells(new Set([cellId]));
  }, []);

  // Handle mouse enter - update selection while dragging
  const handleMouseEnter = useCallback((cellId: string) => {
    if (isDragging && dragStartCell) {
      const range = getCellRange(dragStartCell, cellId);
      setSelectedCells(new Set(range));
    }
  }, [isDragging, dragStartCell]);

  // Handle mouse up - end drag selection
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartCell(null);
    // Close editing mode when drag ends
    setEditingCell(null);
  }, []);

  // Handle cell click (for non-drag multi-select)
  const handleCellClick = useCallback((cellId: string, event?: React.MouseEvent) => {
    // Ignore if we just finished dragging
    if (isDragging) return;
    
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select mode or Ctrl/Cmd + Click: Toggle selection
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
      setLastSelectedCell(cellId);
    } else if (event?.shiftKey && lastSelectedCell) {
      // Shift + Click: Range selection
      const range = getCellRange(lastSelectedCell, cellId);
      setSelectedCells(new Set(range));
    } else {
      // Normal click: Single selection and enter edit mode
      setSelectedCell(cellId);
      setSelectedCells(new Set([cellId]));
      setLastSelectedCell(cellId);
      // Enter edit mode on click - Excel behavior
      setEditingCell(cellId);
    }
  }, [lastSelectedCell, isDragging]);

  // Handle double click to enter edit mode
  const handleDoubleClick = useCallback((cellId: string) => {
    setSelectedCell(cellId);
    setSelectedCells(new Set([cellId]));
    setEditingCell(cellId);
    setLastSelectedCell(cellId);
  }, []);

  const handleCellChange = useCallback((cellId: string, value: string) => {
    setGridData((prev) => ({
      ...prev,
      [cellId]: { value, formula: value },
    }));
  }, []);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, colIndex: number, row: number) => {
      // F2 to enter edit mode
      if (e.key === "F2") {
        e.preventDefault();
        if (selectedCell) {
          setEditingCell(selectedCell);
        }
        return;
      }

      // Enter to confirm and move down
      if (e.key === "Enter" && editingCell) {
        e.preventDefault();
        setEditingCell(null);
        // Move to next row
        if (row < ROWS.length) {
          const nextCellId = getCellId(COLUMNS[colIndex], row + 1);
          setSelectedCell(nextCellId);
          setSelectedCells(new Set([nextCellId]));
        }
      } else if (e.key === "Tab" && editingCell) {
        e.preventDefault();
        setEditingCell(null);
        // Move to next column
        if (colIndex < COLUMNS.length - 1) {
          const nextCellId = getCellId(COLUMNS[colIndex + 1], row);
          setSelectedCell(nextCellId);
          setSelectedCells(new Set([nextCellId]));
        }
      } else if (e.key === "ArrowDown" && !editingCell) {
        e.preventDefault();
        const nextCellId = getCellId(COLUMNS[colIndex], row + 1);
        setSelectedCell(nextCellId);
        setSelectedCells(new Set([nextCellId]));
      } else if (e.key === "ArrowUp" && !editingCell) {
        e.preventDefault();
        const nextCellId = getCellId(COLUMNS[colIndex], row - 1);
        setSelectedCell(nextCellId);
        setSelectedCells(new Set([nextCellId]));
      } else if (e.key === "ArrowRight" && !editingCell) {
        e.preventDefault();
        if (colIndex < COLUMNS.length - 1) {
          const nextCellId = getCellId(COLUMNS[colIndex + 1], row);
          setSelectedCell(nextCellId);
          setSelectedCells(new Set([nextCellId]));
        }
      } else if (e.key === "ArrowLeft" && !editingCell) {
        e.preventDefault();
        if (colIndex > 0) {
          const nextCellId = getCellId(COLUMNS[colIndex - 1], row);
          setSelectedCell(nextCellId);
          setSelectedCells(new Set([nextCellId]));
        }
      } else if (e.key === "Escape" && editingCell) {
        e.preventDefault();
        setEditingCell(null);
      }
    },
    [editingCell, selectedCell]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-xl font-semibold">Data Flow</h1>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4 shadow-sm">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Seçili Hücre:</span>{" "}
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
            {selectedCell || "-"}
          </span>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Değer:</span>{" "}
          <span className="font-mono">{selectedCell ? gridData[selectedCell]?.value || "" : "-"}</span>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFormat('bold')}
            className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded"
            title="Kalın (B)"
          >
            B
          </button>
          <button
            onClick={() => handleFormat('italic')}
            className="px-2 py-1 text-sm italic text-gray-700 hover:bg-gray-100 rounded"
            title="İtalik (I)"
          >
            I
          </button>
          <button
            onClick={() => handleFormat('underline')}
            className="px-2 py-1 text-sm underline text-gray-700 hover:bg-gray-100 rounded"
            title="Altı Çizili (U)"
          >
            U
          </button>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFormat('alignLeft')}
            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
            title="Sola Hizala"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </button>
          <button
            onClick={() => handleFormat('alignCenter')}
            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
            title="Ortala"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </button>
          <button
            onClick={() => handleFormat('alignRight')}
            className="p-1 text-gray-700 hover:bg-gray-100 rounded"
            title="Sağa Hizala"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </button>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        <button
          onClick={() => handleFormat('clear')}
          className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          title="Temizle"
        >
          Temizle
        </button>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold text-gray-600 sticky top-0 left-0 z-30">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="w-28 h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold text-gray-700 sticky top-0 z-10"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row}>
                  <th className="w-12 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold text-gray-600 sticky left-0 z-10">
                    {row}
                  </th>
                  {COLUMNS.map((col, colIndex) => {
                    const cellId = getCellId(col, row);
                    const isSelected = selectedCells.has(cellId);
                    const isMultiSelected = selectedCells.size > 1 && selectedCells.has(cellId);
                    const isEditing = editingCell === cellId;
                    const cellValue = gridData[cellId]?.value || "";
                    const cellFormula = gridData[cellId]?.formula;
                    const cellFormat = gridData[cellId]?.format;
                    
                    // Evaluate formula if exists
                    const displayValue = cellFormula ? evaluateFormula(cellFormula, gridData) : cellValue;

                    // Build format classes
                    const formatClasses = [
                      cellFormat?.bold ? 'font-bold' : '',
                      cellFormat?.italic ? 'italic' : '',
                      cellFormat?.underline ? 'underline' : '',
                      cellFormat?.align === 'left' ? 'text-left' : 
                      cellFormat?.align === 'center' ? 'text-center' : 
                      cellFormat?.align === 'right' ? 'text-right' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <td
                        key={cellId}
                        className={`w-28 h-10 border border-gray-300 p-0 cursor-pointer ${
                          isMultiSelected
                            ? "bg-blue-200 ring-2 ring-blue-400 ring-inset"
                            : isSelected
                            ? "ring-2 ring-blue-500 ring-inset"
                            : "hover:bg-blue-50"
                        }`}
                        onMouseDown={() => handleMouseDown(cellId)}
                        onMouseEnter={() => handleMouseEnter(cellId)}
                        onMouseUp={handleMouseUp}
                        onClick={(e) => handleCellClick(cellId, e)}
                        onDoubleClick={() => handleDoubleClick(cellId)}
                        onKeyDown={(e) => handleKeyDown(e, colIndex, row)}
                        tabIndex={isSelected ? 0 : -1}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => handleCellChange(cellId, e.target.value)}
                            onBlur={handleCellBlur}
                            autoFocus
                            className={`w-full h-full px-2 py-1 text-sm outline-none font-mono ${formatClasses}`}
                          />
                        ) : (
                          <div className={`w-full h-full px-2 py-1 text-sm font-mono truncate ${formatClasses}`}>
                            {displayValue}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t px-4 py-1 text-xs text-gray-600 flex justify-between">
        <span>Seçili Hücre: {selectedCell || "- "}</span>
        <span>Seçili: {selectedCells.size} hücre</span>
        <span>Toplam Satır: {ROWS.length}</span>
        <span>Toplam Sütun: {COLUMNS.length}</span>
      </div>
    </div>
  );
}
