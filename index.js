const fs = require("fs");
const path = require("path");
const { parseDocument } = require("htmlparser2");
const { selectAll } = require("css-select");

// Directory path where the script is executed
const dirPath = __dirname;

// List of column names to skip
const skippedColumns = [
  "نوع درس",
  "تعداد واحد نظري",
  "تعداد واحد عملي",
  "نام کلاس درس",
  "سایر اساتید",
  "تعداد ثبت نامي تاکنون",
  "مكان برگزاري",
  "مقطع ارائه درس",
  "نوع ارائه",
  "سطح ارائه",
  "دانشجويان مجاز به اخذ کلاس",
  "گروه آموزشی",
  "دانشکده",
  "واحد",
  "استان",
];

// Function to process the table and extract its data
const processTableData = (htmlContent) => {
  const document = parseDocument(htmlContent);

  // Find the table with id "scrollable"
  const table = selectAll("table#scrollable", document)[0];
  if (!table) return null;

  const thead = selectAll("thead", table)[0];
  const tbody = selectAll("tbody", table)[0];
  if (!thead || !tbody) return null;

  // Extract column names from <th> tags inside the <thead>
  const headerRow = selectAll("tr", thead)[0];
  const columnNames = selectAll("th", headerRow).map(
    (th) => th.children[0]?.data?.trim() || "",
  );

  // Filter out the columns to skip
  const validColumns = columnNames.filter(
    (name) => !skippedColumns.includes(name),
  );
  const validIndexes = columnNames.map((name, index) =>
    validColumns.includes(name) ? index : -1,
  );

  // Extract and filter data from all <tr> tags inside the <tbody>
  const rows = selectAll("tr", tbody);
  const tableData = rows.map((row) => {
    const cells = selectAll("td", row);
    return validIndexes
      .filter((index) => index !== -1)
      .map((index) => cells[index]?.children[0]?.data?.trim() || "");
  });

  return { columnNames: validColumns, tableData };
};

// Group the table data by "نام درس" and "استاد"
const groupTableData = (columnNames, tableData) => {
  const nameIndex = columnNames.indexOf("نام درس");
  const teacherIndex = columnNames.indexOf("استاد");

  if (nameIndex === -1 || teacherIndex === -1) {
    throw new Error("Required columns ('نام درس' or 'استاد') not found.");
  }

  const groupedData = {};

  tableData.forEach((row) => {
    const name = row[nameIndex];
    const teacher = row[teacherIndex];

    if (!groupedData[name]) groupedData[name] = {};
    if (!groupedData[name][teacher]) groupedData[name][teacher] = [];

    groupedData[name][teacher].push(
      row.filter((_, idx) => idx !== nameIndex && idx !== teacherIndex),
    );
  });

  return groupedData;
};

// Generate a new HTML file with grouped data and Tailwind CSS
const generateHTML = ({ columnNames, groupedData }) => {
  if (!groupedData || Object.keys(groupedData).length === 0) {
    return "<h1 class='text-center text-9xl text-gray-500 mt-10'>No table data found</h1>";
  }

  // Create a new header that matches the grouped data structure
  const updatedHeader = [
    "نام درس",
    "استاد",
    ...columnNames.filter((name) => name !== "نام درس" && name !== "استاد"),
  ];

  const tableRows = Object.entries(groupedData)
    .map(([courseName, teachers]) => {
      const teacherRows = Object.entries(teachers)
        .map(([teacherName, rows]) => {
          const dataRows = rows
            .map(
              (row) => `
              <tr>
                <td></td>
                <td class="px-4 py-2 whitespace-nowrap">${teacherName}</td>
                ${row
                  .map(
                    (cell) =>
                      `<td class="px-4 py-2 whitespace-nowrap">${cell}</td>`,
                  )
                  .join("")}
              </tr>
            `,
            )
            .join("");
          return dataRows;
        })
        .join("");

      return `
        <tr class="bg-gray-200">
          <td colspan="${updatedHeader.length}" class="px-4 py-2 text-right font-bold">${courseName}</td>
        </tr>
        ${teacherRows}
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Table Data</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet">
      <style>
	* {
	  font-family: 'Vazirmatn' !important;
	}
	table {
	  direction: rtl;
	}
      </style>
    </head>
    <body class="bg-gray-100">
      <h1 class="text-7xl text-blue-500 mx-auto text-center pt-12">@law_azad402</h1>
      <div class="mt-10">
        <table class="table-auto w-full bg-white shadow-md rounded border-collapse">
          <thead>
            <tr class="bg-gray-200 text-right">
              ${updatedHeader
                .map(
                  (name) =>
                    `<th class="px-4 py-2 whitespace-nowrap">${name}</th>`,
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};

// Main function to loop through HTML files and process them
const main = () => {
  const htmlFiles = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".html"));
  let aggregatedColumnNames = null;
  let aggregatedTableData = [];

  htmlFiles.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const htmlContent = fs.readFileSync(filePath, "utf-8");
    const result = processTableData(htmlContent);
    if (result) {
      if (!aggregatedColumnNames) aggregatedColumnNames = result.columnNames;
      aggregatedTableData = aggregatedTableData.concat(result.tableData);
    }
  });

  const groupedData = groupTableData(
    aggregatedColumnNames,
    aggregatedTableData,
  );

  const generatedHTML = generateHTML({
    columnNames: aggregatedColumnNames,
    groupedData,
  });
  fs.writeFileSync(path.join(dirPath, "index.html"), generatedHTML, "utf-8");
  console.log("index.html has been generated successfully!");
};

main();
