"use client";

import { useState, useCallback } from "react";

type CellData = {
  value: string;
};

type GridData = Record<string, CellData>;

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ROWS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function Spreadsheet() {
  const [gridData, setGridData] = useState<GridData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  const handleCellClick = useCallback((cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(cellId);
  }, []);

  const handleCellChange = useCallback((cellId: string, value: string) => {
    setGridData((prev) => ({
      ...prev,
      [cellId]: { value },
    }));
  }, []);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, colIndex: number, row: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setEditingCell(null);
        // Move to next row
        if (row < ROWS.length) {
          const nextCellId = getCellId(COLUMNS[colIndex], row + 1);
          setSelectedCell(nextCellId);
          setEditingCell(nextCellId);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        setEditingCell(null);
        // Move to next column
        if (colIndex < COLUMNS.length - 1) {
          const nextCellId = getCellId(COLUMNS[colIndex + 1], row);
          setSelectedCell(nextCellId);
          setEditingCell(nextCellId);
        }
      } else if (e.key === "ArrowDown" && !editingCell) {
        e.preventDefault();
        const nextCellId = getCellId(COLUMNS[colIndex], row + 1);
        setSelectedCell(nextCellId);
      } else if (e.key === "ArrowUp" && !editingCell) {
        e.preventDefault();
        const nextCellId = getCellId(COLUMNS[colIndex], row - 1);
        setSelectedCell(nextCellId);
      } else if (e.key === "ArrowRight" && !editingCell) {
        e.preventDefault();
        if (colIndex < COLUMNS.length - 1) {
          const nextCellId = getCellId(COLUMNS[colIndex + 1], row);
          setSelectedCell(nextCellId);
        }
      } else if (e.key === "ArrowLeft" && !editingCell) {
        e.preventDefault();
        if (colIndex > 0) {
          const nextCellId = getCellId(COLUMNS[colIndex - 1], row);
          setSelectedCell(nextCellId);
        }
      }
    },
    [editingCell]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-xl font-semibold">Excel Benzeri Tablo</h1>
        <p className="text-sm opacity-80">Izgara Temalı Elektronik Tablo</p>
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
                    const isSelected = selectedCell === cellId;
                    const isEditing = editingCell === cellId;
                    const cellValue = gridData[cellId]?.value || "";

                    return (
                      <td
                        key={cellId}
                        className={`w-28 h-10 border border-gray-300 p-0 ${
                          isSelected
                            ? "ring-2 ring-blue-500 ring-inset"
                            : "hover:bg-blue-50"
                        }`}
                        onClick={() => handleCellClick(cellId)}
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
                            className="w-full h-full px-2 py-1 text-sm outline-none font-mono"
                          />
                        ) : (
                          <div className="w-full h-full px-2 py-1 text-sm font-mono truncate">
                            {cellValue}
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
        <span>Toplam Satır: {ROWS.length}</span>
        <span>Toplam Sütun: {COLUMNS.length}</span>
        <span>Hücre Sayısı: {ROWS.length * COLUMNS.length}</span>
      </div>
    </div>
  );
}
