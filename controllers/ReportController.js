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
        case "ExpensePie":
            if(!/\d{4}-\d{2}/.test(req.params.param)){
                return res.redirect('/')
            }
            return res.render('report', {
                report: await generateExpensePie(req.authenticatedUser.id, req.params.param),
                title: "Expense Breakdown For " + req.params.param,
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
        start_date: `${year}-00-01`,
        end_date: `${year}-13-01`,
    })
    let pointSets = [[], []];
    //Concatted portions are 0 amount entries so every month has a point on the chart
    //months is an object with month keys -> arrays of every portion in month
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
async function generateExpensePie(userId, yearmonth) {
    let expenseCategory = fAccountTypes.findIndex(x=>x.name === "Expense");
    let portions = await journalEntryModel.searchTransactionPortions({
        userId,
        categories: [expenseCategory],
        start_date: `${yearmonth}-01`,
        end_date: `${yearmonth}-31`,
    })
    let amountsObject = portions.reduce((acc, x) => ({...acc, [x.faccount_id]: {name: x.faccount_nickname, id: x.faccount_id, amount: (acc[x.faccount_id]?.amount ?? 0) + x.amount}}), {})
    if(Object.keys(amountsObject).length === 0){
        return null;
    }
    let amounts = Object.keys(amountsObject).map(x=>amountsObject[x]).toSorted((a, b) => b.amount - a.amount);
    let total = amounts.reduce((acc, x) => acc + x.amount, 0)
    let angles = amounts.map((x, i) => (x.amount/total)*2*Math.PI).map((x, i, arr) => x + arr.reduce((acc, x, subi) => acc + (subi < i ? x : 0), 0));
    let points = angles.map((x, i)=>{
        let dx = Math.sin(x);
        let dy = -Math.cos(x);
        let t = 0.5/Math.max(Math.abs(dy), Math.abs(dx));
        let extras = []
        if(x >= Math.PI/4 && (i === 0 || angles[i-1] < Math.PI/4)){
            extras.push("1 0");
        }
        if(x >= 3*Math.PI/4 && (i === 0 || angles[i-1] < 3*Math.PI/4)){
            extras.push("1 1");
        }
        if(x >= 5*Math.PI/4 && (i === 0 || angles[i-1] < 5*Math.PI/4)){
            extras.push("0 1");
        }
        if(x >= 7*Math.PI/4 && (i === 0 || angles[i-1] < 7*Math.PI/4)){
            extras.push("0 0");
        }

        return `${extras.join(" ")} ${t*dx+0.5} ${t*dy+0.5}`;

    })
    let colors = points.map(_=> "#" + (Math.floor(Math.random() * 256)).toString(16).padStart(2, '0')
            + (Math.floor(Math.random() * 256)).toString(16).padStart(2, '0')
            + (Math.floor(Math.random() * 256)).toString(16).padStart(2, '0'))
    console.log(total)
    console.log(angles)
    console.log(amounts)
    console.log(points)

    return {
        width: 1,
        height: 1,
        points,
        ids: amounts.map(amount=>amount.id),
        links: amounts.map(amount=>"/expense/" + yearmonth + "/" + amount.id),
        names: amounts.map(x=>x.name),
        amounts: amounts.map(x=>x.amount),
        colors,
        graphType: "pie",
        key: amounts.map((amount, i)=>({name:amount.name + ": $" + Math.floor(amounts[i].amount / 100) + "." + (amounts[i].amount % 100).toString().padStart(2, '0'), color: colors[i]}))
    }
}
async function handleExpenseRequest(req, res) {
    if(!req.params.yearmonth?.match?.(/\d{4}-\d{2}/)){
        return res.redirect('/')
    }

    let expenseCategory = fAccountTypes.findIndex(x=>x.name === "Expense");
    return res.render('journal-entries-list', {
        pageTitle: "Expenses for " + req.params.yearmonth,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: {},
        showTotals: true,
        portions: await journalEntryModel.searchTransactionPortions({
            userId: req.authenticatedUser.id,
            categories: [expenseCategory],
            start_date: `${req.params.yearmonth}-01`,
            end_date: `${req.params.yearmonth}-31`,
            fAccountId: req.params.id ? req.params.id : undefined,
        })
    })
}
async function handleRevenueRequest(req, res) {
    if(!req.params.yearmonth?.match?.(/\d{4}-\d{2}/)){
        return res.redirect('/')
    }
    let revenueCategory = fAccountTypes.findIndex(x=>x.name === "Revenue");
    return res.render('journal-entries-list', {
        pageTitle: "Revenue for " + req.params.yearmonth,
        accounts: await fAccountModel.getFAccountsForUser(req.authenticatedUser.id),
        prefill: {},
        showTotals: true,
        portions: await journalEntryModel.searchTransactionPortions({
            userId: req.authenticatedUser.id,
            categories: [revenueCategory],
            start_date: `${req.params.yearmonth}-01`,
            end_date: `${req.params.yearmonth}-31`,
            fAccountId: req.params.id ? req.params.id : undefined,
        }),
    })
}
async function handleAparReport(req, res){
    let payables = await journalEntryModel.getPayablesForUser(req.authenticatedUser.id);
    let receivables = await journalEntryModel.getReceivablesForUser(req.authenticatedUser.id);
    return res.render('faccounts-list', {
        pageTitle: "AP/AR Report",
        accounts: receivables.map(x=>({...x,categoryString: "Receivable",category: 0,nickname:x.name, balance:x.amount})).concat(
                  payables.map(x=>({...x, categoryString: "Payable", category: 1, nickname: x.name,balance:x.amount}))
        ),
        categoryTotals: {receivable: receivables.reduce((acc, x) => acc + x.amount, 0),
            payable: payables.reduce((acc, x) => acc + -x.amount, 0)}
    })
}
export default {handleReportRequest, handleExpenseRequest, handleRevenueRequest, handleAparReport}