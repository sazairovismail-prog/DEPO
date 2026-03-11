"use client";

import { useState, useCallback, useRef } from "react";

type CellData = {
  value: string;
  formula?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
    fontSize?: number;
    textColor?: string;
    bgColor?: string;
    borderTop?: boolean;
    borderRight?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    numberFormat?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
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
  const cellRefRegex = /([A-P])(\d{1,2})/g;
  
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

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
const ROWS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function Spreadsheet() {
  const [gridData, setGridData] = useState<GridData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [lastSelectedCell, setLastSelectedCell] = useState<string | null>(null);
  
  // Mouse drag selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<string | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<GridData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Clipboard for copy/cut/paste
  const [clipboard, setClipboard] = useState<{ cells: Map<string, CellData>; operation: 'copy' | 'cut' } | null>(null);

  // Find/Replace dialog
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save current state to history
  const saveToHistory = useCallback((newGridData: GridData) => {
    // Remove any future history if we're in the middle
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newGridData)));
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGridData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [history, historyIndex]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGridData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [history, historyIndex]);


  // Handle file save (export to JSON)

  // Handle format buttons (bold, italic, underline, alignment, clear)
  const handleFormat = useCallback((formatType: string, value?: string | number) => {
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
        } else if (formatType === 'fontSize' && typeof value === 'number') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, fontSize: value }
          };
        } else if (formatType === 'textColor' && typeof value === 'string') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, textColor: value }
          };
        } else if (formatType === 'bgColor' && typeof value === 'string') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, bgColor: value }
          };
        } else if (formatType === 'borderTop') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, borderTop: !currentFormat.borderTop }
          };
        } else if (formatType === 'borderRight') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, borderRight: !currentFormat.borderRight }
          };
        } else if (formatType === 'borderBottom') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, borderBottom: !currentFormat.borderBottom }
          };
        } else if (formatType === 'borderLeft') {
          newGrid[cellId] = {
            ...currentCell,
            format: { ...currentFormat, borderLeft: !currentFormat.borderLeft }
          };
        } else if (formatType === 'borderAll') {
          newGrid[cellId] = {
            ...currentCell,
            format: { 
              ...currentFormat, 
              borderTop: !currentFormat.borderTop,
              borderRight: !currentFormat.borderRight,
              borderBottom: !currentFormat.borderBottom,
              borderLeft: !currentFormat.borderLeft
            }
          };
        }
      });
      
      return newGrid;
    });
  }, [selectedCell, selectedCells]);

  // Save grid data to JSON file
  const handleSave = useCallback(() => {
    const dataStr = JSON.stringify(gridData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spreadsheet-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [gridData]);

  // Load grid data from JSON file
  const handleLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedData = JSON.parse(content) as GridData;
        setGridData(loadedData);
      } catch (error) {
        alert("Dosya yüklenirken hata oluştu!");
      }
    };
    reader.readAsText(file);
    // Reset input value to allow loading same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  // Helper function to parse cell ID
  const parseCellId = (cellId: string) => {
    const col = cellId.charAt(0);
    const row = parseInt(cellId.substring(1));
    return { col, row };
  };

  // Copy selected cells
  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return;
    const copiedCells = new Map<string, CellData>();
    selectedCells.forEach(cellId => {
      if (gridData[cellId]) {
        copiedCells.set(cellId, { ...gridData[cellId] });
      }
    });
    setClipboard({ cells: copiedCells, operation: 'copy' });
  }, [selectedCells, gridData]);

  // Cut selected cells
  const handleCut = useCallback(() => {
    if (selectedCells.size === 0) return;
    const cutCells = new Map<string, CellData>();
    selectedCells.forEach(cellId => {
      if (gridData[cellId]) {
        cutCells.set(cellId, { ...gridData[cellId] });
      }
    });
    setClipboard({ cells: cutCells, operation: 'cut' });
  }, [selectedCells, gridData]);

  // Paste from clipboard
  const handlePaste = useCallback(() => {
    if (!clipboard || !selectedCell) return;
    
    setGridData(prev => {
      const newGrid = { ...prev };
      
      // Get the starting position
      const { col: startCol, row: startRow } = parseCellId(selectedCell);
      const startColIndex = COLUMNS.indexOf(startCol);
      
      // Calculate offset from original selection
      let minRow = Infinity;
      let minColIndex = Infinity;
      clipboard.cells.forEach((_, cellId) => {
        const { col, row } = parseCellId(cellId);
        minRow = Math.min(minRow, row);
        minColIndex = Math.min(minColIndex, COLUMNS.indexOf(col));
      });
      
      // Paste each cell
      clipboard.cells.forEach((cellData, origCellId) => {
        const { col: origCol, row: origRow } = parseCellId(origCellId);
        const colOffset = COLUMNS.indexOf(origCol) - minColIndex;
        const rowOffset = origRow - minRow;
        
        const newColIndex = startColIndex + colOffset;
        const newRow = startRow + rowOffset;
        
        if (newColIndex >= 0 && newColIndex < COLUMNS.length && newRow >= 1 && newRow <= ROWS.length) {
          const newCellId = getCellId(COLUMNS[newColIndex], newRow);
          newGrid[newCellId] = { ...cellData };
        }
      });
      
      // If cut operation, clear original cells
      if (clipboard.operation === 'cut') {
        clipboard.cells.forEach((_, cellId) => {
          delete newGrid[cellId];
        });
      }
      
      saveToHistory(newGrid);
      return newGrid;
    });
  }, [clipboard, selectedCell, saveToHistory]);

  // Find next occurrence
  const handleFindNext = useCallback(() => {
    if (!findText) return;
    
    const cells = Object.keys(gridData);
    let startIndex = selectedCell ? cells.indexOf(selectedCell) + 1 : 0;
    
    for (let i = 0; i < cells.length; i++) {
      const idx = (startIndex + i) % cells.length;
      const cellId = cells[idx];
      const cellValue = gridData[cellId]?.value || '';
      if (cellValue.toLowerCase().includes(findText.toLowerCase())) {
        setSelectedCell(cellId);
        setSelectedCells(new Set([cellId]));
        return;
      }
    }
    alert('Bulunamadı!');
  }, [findText, gridData, selectedCell]);

  // Replace current occurrence
  const handleReplace = useCallback(() => {
    if (!selectedCell || !replaceText) return;
    
    const cellValue = gridData[selectedCell]?.value || '';
    if (cellValue.toLowerCase().includes(findText.toLowerCase())) {
      const newValue = cellValue.replace(new RegExp(findText, 'gi'), replaceText);
      setGridData(prev => {
        const newGrid = { ...prev, [selectedCell]: { ...prev[selectedCell], value: newValue, formula: newValue } };
        saveToHistory(newGrid);
        return newGrid;
      });
    }
  }, [selectedCell, findText, replaceText, gridData, saveToHistory]);

  // Replace all
  const handleReplaceAll = useCallback(() => {
    if (!findText || !replaceText) return;
    
    setGridData(prev => {
      const newGrid = { ...prev };
      Object.keys(newGrid).forEach(cellId => {
        const cellValue = newGrid[cellId].value;
        if (cellValue.toLowerCase().includes(findText.toLowerCase())) {
          const newValue = cellValue.replace(new RegExp(findText, 'gi'), replaceText);
          newGrid[cellId] = { ...newGrid[cellId], value: newValue, formula: newValue };
        }
      });
      saveToHistory(newGrid);
      return newGrid;
    });
  }, [findText, replaceText, saveToHistory]);

  // Handle format for number formatting
  const handleNumberFormat = useCallback((formatType: string) => {
    if (!selectedCell) return;
    
    setGridData(prev => {
      const newGrid = { ...prev };
      const cellsToFormat = selectedCells.size > 0 ? Array.from(selectedCells) : [selectedCell];
      
      cellsToFormat.forEach(cellId => {
        const currentCell = prev[cellId] || { value: '' };
        const currentFormat = currentCell.format || {};
        newGrid[cellId] = {
          ...currentCell,
          format: { 
            ...currentFormat, 
            numberFormat: formatType as 'text' | 'number' | 'currency' | 'percentage' | 'date' | undefined
          }
        };
      });
      
      return newGrid;
    });
  }, [selectedCell, selectedCells]);

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
    setGridData((prev) => {
      const newGrid = {
        ...prev,
        [cellId]: { value, formula: value },
      };
      // Save to history
      saveToHistory(newGrid);
      return newGrid;
    });
  }, [saveToHistory]);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, colIndex: number, row: number) => {
      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }
      
      // Cut (Ctrl+X)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
        return;
      }
      
      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }
      
      // Find (Ctrl+F)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
        return;
      }
      
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
    [editingCell, selectedCell, handleCopy, handleCut, handlePaste, setShowFindReplace]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header })
      <div className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-xl font-semibold">Data Flow</h1>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b shadow-sm">
        {/* First row - Main operations */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 flex-wrap">
          {/* Cell Info */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border">
            <span className="text-sm text-gray-500">A1:</span>
            <span className="font-mono font-medium text-gray-800 min-w-[60px]">{selectedCell || "-"}</span>
          </div>
          
          {/* Copy/Cut/Paste */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              title="Kopyala (Ctrl+C)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleCut}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              title="Kes (Ctrl+X)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </button>
            <button
              onClick={handlePaste}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              title="Yapıştır (Ctrl+V)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>
          
          <div className="h-5 w-px bg-gray-300 mx-1"></div>
          
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded ${historyIndex <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Geri Al (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded ${historyIndex >= history.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Yeniden Yap (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
          
          <div className="h-5 w-px bg-gray-300 mx-1"></div>
          
          {/* Find/Replace */}
          <button
            onClick={() => setShowFindReplace(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Bul/Değiştir (Ctrl+F)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Bul
          </button>
          
          {/* File operations - right side */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-1"
              title="Dosya Yükle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Yükle
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"
              title="Dosya Kaydet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Kaydet
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleLoad}
              className="hidden"
            />
          </div>
        </div>
        
        {/* Second row - Formatting */}
        <div className="flex items-center gap-3 px-4 py-2 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Biçim</span>
            <button
              onClick={() => handleFormat('bold')}
              className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded"
              title="Kalın (B)"
            >
              B
            </button>
            <button
              onClick={() => handleFormat('italic')}
              className="px-2 py-1 text-sm italic text-gray-700 hover:bg-gray-200 rounded"
              title="İtalik (I)"
            >
              I
            </button>
            <button
              onClick={() => handleFormat('underline')}
              className="px-2 py-1 text-sm underline text-gray-700 hover:bg-gray-200 rounded"
              title="Altı Çizili (U)"
            >
              U
            </button>
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Alignment */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Hizala</span>
            <button
              onClick={() => handleFormat('alignLeft')}
              className="p-1 text-gray-700 hover:bg-gray-200 rounded"
              title="Sola Hizala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
            <button
              onClick={() => handleFormat('alignCenter')}
              className="p-1 text-gray-700 hover:bg-gray-200 rounded"
              title="Ortala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
              </svg>
            </button>
            <button
              onClick={() => handleFormat('alignRight')}
              className="p-1 text-gray-700 hover:bg-gray-200 rounded"
              title="Sağa Hizala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
              </svg>
            </button>
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Font Size */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Boyut</span>
            <select
              onChange={(e) => handleFormat('fontSize', parseInt(e.target.value))}
              className="text-sm border rounded px-2 py-1 bg-white"
              title="Yazı Boyutu"
            >
              <option value="">Seç</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="24">24</option>
              <option value="28">28</option>
              <option value="36">36</option>
            </select>
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Colors */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Renk</span>
            <input
              type="color"
              onChange={(e) => handleFormat('textColor', e.target.value)}
              className="w-7 h-7 cursor-pointer rounded border-0"
              title="Yazı Rengi"
            />
            <input
              type="color"
              onChange={(e) => handleFormat('bgColor', e.target.value)}
              className="w-7 h-7 cursor-pointer rounded border-0"
              title="Dolgu Rengi"
            />
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Borders */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Kenar</span>
            <button
              onClick={() => handleFormat('borderAll')}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded border"
              title="Tüm Kenarlıklar"
            >
              ▦
            </button>
            <button
              onClick={() => handleFormat('borderTop')}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
              title="Üst"
            >
              ▬
            </button>
            <button
              onClick={() => handleFormat('borderBottom')}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
              title="Alt"
            >
              ▬
            </button>
            <button
              onClick={() => handleFormat('borderLeft')}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
              title="Sol"
            >
              │
            </button>
            <button
              onClick={() => handleFormat('borderRight')}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
              title="Sağ"
            >
              │
            </button>
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Number Format */}
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
            <span className="text-xs text-gray-400 mr-1">Sayı</span>
            <select
              onChange={(e) => handleNumberFormat(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-white"
              title="Sayı Biçimi"
            >
              <option value="">Biçim</option>
              <option value="text">Metin</option>
              <option value="number">Sayı</option>
              <option value="currency">Para</option>
              <option value="percentage">Yüzde</option>
            </select>
          </div>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Clear */}
          <button
            onClick={() => handleFormat('clear')}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
            title="Temizle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Temizle
          </button>
        </div>
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

                    // Build inline styles
                    const cellStyle: React.CSSProperties = {
                      fontSize: cellFormat?.fontSize ? `${cellFormat.fontSize}px` : undefined,
                      color: cellFormat?.textColor || 'inherit',
                      backgroundColor: cellFormat?.bgColor || (isSelected ? '#eff6ff' : isMultiSelected ? '#dbeafe' : undefined),
                      borderTop: cellFormat?.borderTop ? '2px solid #000' : undefined,
                      borderBottom: cellFormat?.borderBottom ? '2px solid #000' : undefined,
                      borderLeft: cellFormat?.borderLeft ? '2px solid #000' : undefined,
                      borderRight: cellFormat?.borderRight ? '2px solid #000' : undefined,
                    };

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
                        style={cellStyle}
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
                            style={{ 
                              fontSize: cellFormat?.fontSize ? `${cellFormat.fontSize}px` : undefined,
                              color: cellFormat?.textColor || 'inherit',
                              backgroundColor: cellFormat?.bgColor || 'transparent',
                            }}
                          />
                        ) : (
                          <div 
                            className={`w-full h-full px-2 py-1 text-sm font-mono truncate ${formatClasses}`}
                            style={{ 
                              fontSize: cellFormat?.fontSize ? `${cellFormat.fontSize}px` : undefined,
                              color: cellFormat?.textColor || 'inherit',
                            }}
                          >
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

      {/* Find/Replace Dialog */}
      {showFindReplace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-96">
            <h3 className="text-lg font-semibold mb-4">Bul ve Değiştir</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bul:</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Metin ara..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Değiştir:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Yeni metin..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleFindNext}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Bul
              </button>
              <button
                onClick={handleReplace}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Değiştir
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Tümünü Değiştir
              </button>
              <button
                onClick={() => setShowFindReplace(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
