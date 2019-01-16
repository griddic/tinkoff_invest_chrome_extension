function parse_amount(amount_str) {
    var amount_str = amount_str.replace(',','.')
    amount_str = amount_str.substring(0, amount_str.length - 1)
    amount_str = amount_str.replace(' ','')
    amount_str = amount_str.replace(' ','')
    return parseFloat(amount_str)
}

function compute_USDRUB_cource() {
    // var USDRUB_row = $('[href*="/USDRUB/"]').closest('tr')
    var USDRUB_row = document.querySelector('[href*="/USDRUB/"]').closest('tr')
    var USDRUB_usd_str = USDRUB_row.querySelector('[data-qa-file="Money"]').textContent
    var USDRUB_rub_str = USDRUB_row.querySelectorAll('[data-qa-file="Money"]')[3].innerText
    var USDRUB_usd = parse_amount(USDRUB_usd_str)
    var USDRUB_rub = parse_amount(USDRUB_rub_str)
    return USDRUB_rub/USDRUB_usd
}

var rub = 'rub'
var usd = 'usd'
var stock = 'stock'
var bond = 'bond'
var cash = 'cash'


function compute_equty_type(row) {
    var clicable = row.querySelector('[data-qa-file="Clickable"]')
    if (clicable == null) {
        return cash
    }
    var link = clicable.href
    if (link.includes('bonds')){
        return bond
        }
    if (link.includes('stocks')){
        return stock
        } 
    if (link.includes('currencies')) {
        return cash
        } 
    throw new Error(link)
}

function extract_currency_symbol(money_str) {
    return money_str[money_str.length - 1]
}


function compute_cost_matrix(){
    var cost_by_type_and_currency = {
        stock: {
            rub: 0,
            usd: 0
        },
        bond: {
            rub: 0,
            usd: 0
        },
        cash: {
            rub: 0,
            usd: 0
        }
    }
    var USDRUB_course = compute_USDRUB_cource()
    console.log(USDRUB_course)
    var currencies_curses = {
        usd: USDRUB_course,
        rub: 1   
    }
    console.log(currencies_curses)


    var account_table = document.querySelector('[data-qa-file="Table"]')
    var rows = account_table.getElementsByTagName('tr')
    for (var i = 0; i < rows.length; i++){
        var equty_type = compute_equty_type(rows[i])
        var money_string = rows[i].querySelector('[data-qa-file="Money"]').textContent
        var symbol = extract_currency_symbol(money_string)
        var curr;
        if (symbol == '₽'){
            curr = rub
        } else if (symbol == '$') {
            curr = usd
        } else {
            console.log(money_string)
            console.log("fuck", symbol)
        }
        var amount = parse_amount(money_string)
    //     console.log(equty_type, symbol, amount)
        cost_by_type_and_currency[equty_type][curr] += amount * currencies_curses[curr]
    }
    return cost_by_type_and_currency    
}
function compute_aggregated(cost_matrix) {
    var in_rubles = cost_matrix['bond'][rub]
    in_rubles = in_rubles + cost_matrix['stock'][rub]
    in_rubles = in_rubles + cost_matrix['cash'][rub]

    var in_usd = cost_matrix['bond'][usd]
    in_usd = in_usd + cost_matrix['stock'][usd]
    in_usd = in_usd + cost_matrix['cash'][usd]

    var in_cash = cost_matrix['cash'][rub]
    in_cash = in_cash + cost_matrix['cash'][usd]

    var in_stocks = cost_matrix['stock'][rub]
    in_stocks = in_stocks + cost_matrix['stock'][usd]

    var in_bonds = cost_matrix['bond'][rub]
    in_bonds = in_bonds + cost_matrix['bond'][usd]

    var total = in_rubles + in_usd

    var aggregated = {}
    aggregated[rub] = in_rubles
    aggregated[usd] = in_usd
    aggregated[bond] = in_bonds
    aggregated[stock] = in_stocks
    aggregated[cash] = in_cash
    aggregated['total'] = total
    return aggregated
}
function compute_aggregated_percentage(aggregated) {
    var percentages = {}
    percentages[rub] = 100 * aggregated[rub] / aggregated['total']
    percentages[usd] = 100 * aggregated[usd] / aggregated['total']
    percentages[bond] = 100 * aggregated[bond] / aggregated['total']
    percentages[stock] = 100 * aggregated[stock] / aggregated['total']
    percentages[cash] = 100 * aggregated[cash] / aggregated['total']
    return percentages
} 


function create_table_for_document(cost_matrix, aggregated, percentages) {
    var html = `
    <table>
    <tr>
        <td align="center">
            <input id="refresh_PT" type="button" value="Refresh" onclick="compute_and_insert_percentages_table();" >
                    <script type="text/javascript" src="compute_and_insert.js"></script>
            </input>

        </td>
        <td align="center">equity_type</td>
        <td align="center">stocks</td>
        <td align="center">bonds</td>
        <td align="center">cash</td>
    </tr>
    <tr>
        <td align="center">currency</td>
        <td align="center"> </td>
        <td align="center">${aggregated['stock'].toFixed(2)} (${percentages['stock'].toFixed(0)}%) </td>
        <td align="center">${aggregated['bond'].toFixed(2)} (${percentages['bond'].toFixed(0)}%) </td>
        <td align="center">${aggregated['cash'].toFixed(2)} (${percentages['cash'].toFixed(0)}%) </td>
        
    </tr>
    <tr>
        <td align="center">USD</td>
        <td align="center">${aggregated[usd].toFixed(2)} (${percentages[usd].toFixed(0)}%) </td>
        <td align="center">${cost_matrix[stock][usd].toFixed(2)}</td>
        <td align="center">${cost_matrix[bond][usd].toFixed(2)}</td>
        <td align="center">${cost_matrix[cash][usd].toFixed(2)}</td>
    </tr>
    <tr>
        <td align="center">RUR</td>
        <td align="center">${aggregated[rub].toFixed(2)} (${percentages[rub].toFixed(0)}%) </td>
        <td align="center">${cost_matrix[stock][rub].toFixed(2)}</td>
        <td align="center">${cost_matrix[bond][rub].toFixed(2)}</td>
        <td align="center">${cost_matrix[cash][rub].toFixed(2)}</td>
    </tr>
</table>
`
    var table = document.createElement('table')
    table.setAttribute('id', 'percentages_table')
    table.setAttribute('border', '3')
    table.setAttribute('width', '100%')
    table.innerHTML = html
    return table
}

function add_to_header(el){
    var current_table = document.getElementById('percentages_table')
    if (current_table == null) {
        var header = document.querySelector('[data-qa-file="BrokerAccountsHeaderPure"]')
        header.appendChild(el)
    } else {
        current_table.innerHTML = el.innerHTML
    }
}

function compute_and_insert_percentages_table(){
    var cost_by_type_and_currency = compute_cost_matrix()
    var aggregated = compute_aggregated(cost_by_type_and_currency)
    var percentages = compute_aggregated_percentage(aggregated)

    var table = create_table_for_document(cost_by_type_and_currency, aggregated, percentages)
    add_to_header(table)
}

function proceed_after_header_appear(){
    header = document.querySelector('[data-qa-file="BrokerAccountsHeaderPure"]')
    if (header == null){
        console.log("waiting for a header.")
        setTimeout(proceed_after_header_appear, 1000)
    } else {
        console.log("Header is heare!!!")
        compute_and_insert_percentages_table()
    }
}

function create_empty_table(){
    var html = '<table><tr><td>refresh</td><td></td></tr></table>'
    var table = document.createElement('table')
    table.setAttribute('id', 'percentages_table')
    table.setAttribute('border', '3')
    table.setAttribute('width', '100%')
    table.innerHTML = html
    add_to_header(table)
}


