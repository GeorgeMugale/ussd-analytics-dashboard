import html2canvas from "html2canvas";
import React from "react";
import Papa from "papaparse";
import { TooltipProps } from "recharts";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Download, FileText, File } from 'lucide-react';

/**
 * Generic PDF export function
 * @param filename the name of the file
 * @param ref the react component being painted n to pdf
 */
export const exportAsPDF = async (
  name: string,
  ref: React.RefObject<HTMLElement | null>
) => {
  if (!ref.current) return;

  const chart = ref.current;
  const canvas = await html2canvas(chart, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const tempDiv: HTMLDivElement = document.createElement("div");
  const tempImg: HTMLImageElement = document.createElement("img");
  tempImg.src = imgData;
  tempDiv.appendChild(tempImg);

  const html2pdf = (await import("html2pdf.js")).default;

  html2pdf()
    .set({
      margin: 10,
      filename: `ussd-${name}-report.pdf`,
      image: { quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(tempDiv)
    .save()
    .catch((err) => console.error(err));
};

/**
 * Generic CSV export function
 * @param data  the data that will be written to the csv file
 * @param filename the file name
 * @param columns the columns for the data, if no columns use object properties
 */
export const exportAsCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) => {
  // If columns are specified, transform the data
  const csvData = columns
    ? data.map((row) => {
        const transformedRow: Record<string, any> = {};
        columns.forEach((col) => {
          transformedRow[col.label] = row[col.key];
        });
        return transformedRow;
      })
    : data;

  // Convert to CSV
  const csv = Papa.unparse(csvData);

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Tooltip interface for react recharts
 */
export interface CustomTooltipProps<T> extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    payload: T;
  }>;
  label?: string;
}

/**
 * Time range intervals for chart filtering
 */
export type TimeRange = "24h" | "7d" | "30d" | "90d";


const MySwal = withReactContent(Swal);

/**
 * Popup for export options
 * @param onExportPDF callback for exporting to pdf
 * @param onExportCSV  callback for exporting to csv
 */
export const showExportDialog = async (
  onExportPDF: () => Promise<void>,
  onExportCSV: () => void
) => {
  const result = await MySwal.fire({
    title: 'Export Data',
    html: `
      <div style="text-align: left; padding: 20px;">
        <p style="color: #6b7280; margin-bottom: 20px;">
          Choose your preferred export format
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button 
            id="export-pdf" 
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px;
              background: linear-gradient(to right, #EF4444, #DC2626);
              color: white;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              transition: transform 0.2s;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div style="text-align: left;">
              <div>Export as PDF</div>
              <div style="font-size: 12px; opacity: 0.9;">Visual report with charts</div>
            </div>
          </button>
          
          <button 
            id="export-csv" 
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px;
              background: linear-gradient(to right, #10B981, #059669);
              color: white;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              transition: transform 0.2s;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div style="text-align: left;">
              <div>Export as CSV</div>
              <div style="font-size: 12px; opacity: 0.9;">Raw data for analysis</div>
            </div>
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: 'export-dialog',
      closeButton: 'export-dialog-close'
    },
    didOpen: () => {
      const pdfBtn = document.getElementById('export-pdf');
      const csvBtn = document.getElementById('export-csv');
      
      pdfBtn?.addEventListener('click', async () => {
        MySwal.close();
        MySwal.fire({
          title: 'Generating PDF...',
          text: 'Please wait while we create your report',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        try {
          await onExportPDF();
          await MySwal.fire({
            icon: 'success',
            title: 'PDF Downloaded!',
            text: 'Your report has been generated successfully',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          await MySwal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'There was an error generating your PDF',
            confirmButtonColor: '#EF4444'
          });
        }
      });
      
      csvBtn?.addEventListener('click', () => {
        MySwal.close();
        MySwal.fire({
          title: 'Generating CSV...',
          text: 'Preparing your data',
          timer: 1000,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        }).then(() => {
          onExportCSV();
          MySwal.fire({
            icon: 'success',
            title: 'CSV Downloaded!',
            text: 'Your data has been exported successfully',
            timer: 2000,
            showConfirmButton: false
          });
        });
      });
    }
  });
};