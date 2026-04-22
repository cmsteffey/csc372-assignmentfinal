import fAccountTypes from "../models/FAccountType.js"
import journalEntryModel from "../models/JournalEntry.js";
import fAccountModel from "../models/FAccount.js";
/*
  Report Result Format:
  {
    height: Number,
    width: Number,
    graphType: "line" | ...,
    ...
  }
  For graphType === "line":
    pointSets: Array[Array[{x, y, link?, tooltip?}]],
    colors: Array[String]
 */
async function handleReportRequest(req, res) {
    switch(req.params.type){
        case "InE":
            if(!/\d{4}/.test(req.params.param)){
                return res.redirect('/')
            }
            return res.render('report', {
                report: await generateInE(req.authenticatedUser.id, req.params.param),
                title: "Income and Expense For " + req.params.param,
            })
        default:
            return res.redirect('/');
    }
}
async function generateInE(userId, year) {
    let expenseCategory = fAccountTypes.findIndex(x=>x.name === "Expense");
    let revenueCategory = fAccountTypes.findIndex(x=>x.name === "Revenue");
    let portions = await journalEntryModel.searchTransactionPortions({
        userId,
        categories: [expenseCategory, revenueCategory],
        start_date: `${year}-00-00`,
        end_date: `${year}-13-00`,
    })
    let pointSets = [[], []];
    let months = Object.groupBy(portions.concat([...Array(24).keys()].map(x=>({for_date: `0000-${((x%12)+1).toString().padStart(2, '0')}-00`, faccount_category: [expenseCategory, revenueCategory][Math.floor(x / 12)],amount: 0}))), x=>x.for_date.substring(5, 7));
    for(let i = 0; i < 12; ++i){
        let monthRevenue = months[(i + 1).toString().padStart(2, "0")].filter(x=>x.faccount_category === revenueCategory).reduce((acc, x) => acc + -x.amount, 0)
        let monthExpenses = months[(i + 1).toString().padStart(2, "0")].filter(x=>x.faccount_category === expenseCategory).reduce((acc, x) => acc + x.amount, 0)
        pointSets[0].push({
            x: i * 100,
            y: monthRevenue,
            tooltip: (i + 1).toString().padStart(2, "0") + "/" + year + " Revenue: $" + Math.floor(Math.abs(monthRevenue) / 100) + "." + (monthRevenue % 100).toString().padStart(2, "0"),
            link: "/revenue/" + year + "-" + (i + 1).toString().padStart(2, "0"),
        });
        pointSets[1].push({
            x: i * 100,
            y: monthExpenses,
            tooltip: (i + 1).toString().padStart(2, "0") + "/" + year + " Expenses: $" + Math.floor(Math.abs(monthExpenses) / 100) + "." + (monthExpenses % 100).toString().padStart(2, "0"),
            link: "/expense/" + year + "-" + (i + 1).toString().padStart(2, "0"),
        });
    }
    return {width: 1100, height: pointSets.flatMap(x=>x).reduce((acc, x) => x.y > acc ? x.y : acc, 0) + -pointSets.flatMap(x=>x).reduce((acc, x) => x.y < acc ? x.y : acc, 0),graphType: "line", pointSets, colors: ["green", "red"]}
}
async function handleExpenseRequest(req, res) {
    let expenseCategory = fAccountTypes.findIndex(x=>x.name === "Expense");
    return res.render('journal-entries-list', {
        pageTitle: "Expenses for " + req.params.yearmonth,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: {},
        showTotals: true,
        portions: await journalEntryModel.searchTransactionPortions({
            userId: req.authenticatedUser.id,
            categories: [expenseCategory],
            start_date: `${req.params.yearmonth}-00`,
            end_date: `${req.params.yearmonth}-32`,
        })
    })
}
async function handleRevenueRequest(req, res) {
    let revenueCategory = fAccountTypes.findIndex(x=>x.name === "Revenue");
    return res.render('journal-entries-list', {
        pageTitle: "Revenue for " + req.params.yearmonth,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: {},
        showTotals: true,
        portions: await journalEntryModel.searchTransactionPortions({
            userId: req.authenticatedUser.id,
            categories: [revenueCategory],
            start_date: `${req.params.yearmonth}-00`,
            end_date: `${req.params.yearmonth}-32`,
        }),
    })
}
export default {handleReportRequest, handleExpenseRequest, handleRevenueRequest}