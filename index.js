const fs = require("fs");
const path = require("path");
const { parseDocument } = require("htmlparser2");
const { selectAll } = require("css-select");

// Directory path where the script is executed
const dirPath = __dirname;

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
	const columnNames = selectAll("th", headerRow).map((th) => th.children[0]?.data?.trim() || "");

	// Extract data from all <tr> tags inside the <tbody>
	const rows = selectAll("tr", tbody);
	const tableData = rows.map((row) => {
		const cells = selectAll("td", row);
		return cells.map((cell) => cell.children[0]?.data?.trim() || "");
	});

	return { columnNames, tableData };
};

// Generate a new HTML file with Tailwind CSS
const generateHTML = ({ columnNames, tableData }) => {
	if (!tableData || tableData.length === 0) {
		return "<h1 class='text-center text-9xl text-gray-500 mt-10'>No table data found</h1>";
	}

	const tableRows = tableData
		.map(
			(row) => `
        <tr class="border-b">
          ${row.map((cell) => `<td class="px-4 py-2 whitespace-nowrap">${cell}</td>`).join("")}
        </tr>
      `
		)
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
      <h1 class="text-center text-9xl text-blue-500 mt-10">@Law_Azad402</h1>
      <div class="mt-10">
        <table class="table-auto w-full bg-white shadow-md rounded border-collapse">
          <thead>
            <tr class="bg-gray-200 text-right">
              ${columnNames.map((name) => `<th class="px-4 py-2 whitespace-nowrap">${name}</th>`).join("")}
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
	const htmlFiles = fs.readdirSync(dirPath).filter((file) => file.endsWith(".html"));
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

	const generatedHTML = generateHTML({ columnNames: aggregatedColumnNames, tableData: aggregatedTableData });
	fs.writeFileSync(path.join(dirPath, "index.html"), generatedHTML, "utf-8");
	console.log("index.html has been generated successfully!");
};

main();
