(async function () {
    const Excel = require("exceljs");
    const workbook = new Excel.Workbook();
    let p = await workbook.xlsx.readFile("C:/users/yojok/Desktop/동아리용.xlsx");
    let k = p.worksheets[0];
    //2~5
    k.eachRow(function (row, n) {
        if (n >= 3) {
            let name = row.getCell(2).value;
            let detail = row.getCell(3).value;
            let minimal = row.getCell(4).value;
            let maximal = row.getCell(5).value;
            let endTime = row.getCell(6).value;

            console.log("K----");
            console.log(name);
            console.log(detail);
            console.log(minimal);
            console.log(maximal.result);
            console.log(endTime);
        }
    });
})();