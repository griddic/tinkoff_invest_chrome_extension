function parse_amount(amount_str) {
    let _amount_str = amount_str.replace(',', '.');
    _amount_str = _amount_str.substring(0, _amount_str.length - 1);
    _amount_str = _amount_str.replace(' ','');
    _amount_str = _amount_str.replace(' ','');
    return parseFloat(_amount_str)
}

function compute_USDRUB_cource() {
    // var USDRUB_row = $('[href*="/USDRUB/"]').closest('tr')
    const USDRUB_row = document.querySelector('[href*="/USDRUB/"]').closest('tr');
    const USDRUB_usd_str = USDRUB_row.querySelector('[data-qa-file="Money"]').textContent;
    const USDRUB_rub_str = USDRUB_row.querySelectorAll('[data-qa-file="Money"]')[3].innerText;
    const USDRUB_usd = parse_amount(USDRUB_usd_str);
    const USDRUB_rub = parse_amount(USDRUB_rub_str);
    return USDRUB_rub/USDRUB_usd
}

const rub = 'rub';
const usd = 'usd';
const stock = 'stock';
const bond = 'bond';
const cash = 'cash';
const rubSymbol = '₽'
const usdSymbol = '$'


function compute_equity_type(row) {
    const href = row.querySelector('a');
    if (href == null) {
        return cash
    }
    const link = href.href;
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
    const cost_by_type_and_currency = {
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
    };
    const USDRUB_course = compute_USDRUB_cource();
    // console.log(USDRUB_course);
    const currencies_curses = {
        usd: USDRUB_course,
        rub: 1
    };
    // console.log(currencies_curses);


    const account_table = document.querySelector('[data-qa-file="Table"]');
    const rows = account_table.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++){
        const equty_type = compute_equity_type(rows[i]);
        const money_string = rows[i].querySelector('[data-qa-file="Money"]').textContent;
        const symbol = extract_currency_symbol(money_string);
        let curr;
        if (symbol === rubSymbol){
            curr = rub
        } else if (symbol === usdSymbol) {
            curr = usd
        } else {
            // console.log(money_string);
            // console.log("fuck", symbol)
        }
        const amount = parse_amount(money_string);
        cost_by_type_and_currency[equty_type][curr] += amount * currencies_curses[curr]
    }
    return cost_by_type_and_currency    
}
function compute_aggregated(cost_matrix) {
    let in_rubles = cost_matrix['bond'][rub];
    in_rubles = in_rubles + cost_matrix['stock'][rub];
    in_rubles = in_rubles + cost_matrix['cash'][rub];

    let in_usd = cost_matrix['bond'][usd];
    in_usd = in_usd + cost_matrix['stock'][usd];
    in_usd = in_usd + cost_matrix['cash'][usd];

    let in_cash = cost_matrix['cash'][rub];
    in_cash = in_cash + cost_matrix['cash'][usd];

    let in_stocks = cost_matrix['stock'][rub];
    in_stocks = in_stocks + cost_matrix['stock'][usd];

    let in_bonds = cost_matrix['bond'][rub];
    in_bonds = in_bonds + cost_matrix['bond'][usd];

    const total = in_rubles + in_usd;

    const aggregated = {};
    aggregated[rub] = in_rubles;
    aggregated[usd] = in_usd;
    aggregated[bond] = in_bonds;
    aggregated[stock] = in_stocks;
    aggregated[cash] = in_cash;
    aggregated['total'] = total;
    return aggregated
}
function compute_aggregated_percentage(aggregated) {
    const percentages = {};
    percentages[rub] = 100 * aggregated[rub] / aggregated['total'];
    percentages[usd] = 100 * aggregated[usd] / aggregated['total'];
    percentages[bond] = 100 * aggregated[bond] / aggregated['total'];
    percentages[stock] = 100 * aggregated[stock] / aggregated['total'];
    percentages[cash] = 100 * aggregated[cash] / aggregated['total'];
    return percentages
}

function centred(node) {
    node.setAttribute('align', 'center')
    return node
}

function createRubValue(value) {
    let node = document.createElement('div')
    let nodeAbs = document.createElement('div')
    nodeAbs.innerText = value.toFixed(2).replace(/(\d)(?=(\d{3})+[. ])/g, '$1  ') + ' ₽'
    node.appendChild(nodeAbs)
    return centred(node)
}

function createRubValueWithPercentages(absoluteValue, relativeValue) {
    let node = createRubValue(absoluteValue)
    let nodeRel = document.createElement('div')
    nodeRel.innerText = relativeValue.toFixed(0) + '%'
    nodeRel.setAttribute('style', "color: blue;font-weight:bold;")
    node.appendChild(nodeRel)
    return node
}

function createCentredTextCell(text) {
    let node = document.createElement('div')
    node.innerText = text
    return centred(node)
}

function create_table_for_document(cost_matrix, aggregated, percentages) {
    let table = document.createElement('table');
    table.setAttribute('id', 'percentages_table');
    table.setAttribute('border', '3');
    table.setAttribute('width', '100%');

    let body = table.createTBody()
    let headerRow = body.insertRow()
    let refreshCell = headerRow.insertCell()

    let refreshButton = document.createElement('button')
    refreshButton.innerText = 'Refresh'
    refreshButton.onclick = function (ev) {
        ev.preventDefault()
        compute_and_insert_percentages_table()
    }
    refreshCell.appendChild(refreshButton)

    headerRow.insertCell().appendChild(createCentredTextCell('equity type'))
    headerRow.insertCell().appendChild(createCentredTextCell('stocks'))
    headerRow.insertCell().appendChild(createCentredTextCell('bonds'))
    headerRow.insertCell().appendChild(createCentredTextCell('cash'))

    let subHeaderRow = table.insertRow()
    subHeaderRow.insertCell().appendChild(createCentredTextCell('currency'))
    subHeaderRow.insertCell().appendChild(createCentredTextCell(''))
    subHeaderRow.insertCell().appendChild(createRubValueWithPercentages(aggregated[stock], percentages[stock]))
    subHeaderRow.insertCell().appendChild(createRubValueWithPercentages(aggregated[bond], percentages[bond]))
    subHeaderRow.insertCell().appendChild(createRubValueWithPercentages(aggregated[cash], percentages[cash]))

    let rubRow = table.insertRow()
    rubRow.insertCell().appendChild(createCentredTextCell(rubSymbol))
    rubRow.insertCell().appendChild(createRubValueWithPercentages(aggregated[rub], percentages[rub]))
    rubRow.insertCell().appendChild(createRubValue(cost_matrix[stock][rub]))
    rubRow.insertCell().appendChild(createRubValue(cost_matrix[bond][rub]))
    rubRow.insertCell().appendChild(createRubValue(cost_matrix[cash][rub]))

    let usdRow = table.insertRow()
    usdRow.insertCell().appendChild(createCentredTextCell(usdSymbol + ' (' + compute_USDRUB_cource().toFixed(2) +  ' ' + rubSymbol + ')'))
    usdRow.insertCell().appendChild(createRubValueWithPercentages(aggregated[usd], percentages[usd]))
    usdRow.insertCell().appendChild(createRubValue(cost_matrix[stock][usd]))
    usdRow.insertCell().appendChild(createRubValue(cost_matrix[bond][usd]))
    usdRow.insertCell().appendChild(createRubValue(cost_matrix[cash][usd]))

    return table
}

function add_to_header(el){
    const current_table = document.getElementById('percentages_table');
    if (current_table == null) {
        const header = document.querySelector('[data-qa-file="BrokerAccountsHeaderPure"]');
        header.appendChild(el)
    } else {
        current_table.parentElement.replaceChild(el, current_table)
    }
}

function compute_and_insert_percentages_table(){
    const cost_by_type_and_currency = compute_cost_matrix();
    const aggregated = compute_aggregated(cost_by_type_and_currency);
    const percentages = compute_aggregated_percentage(aggregated);

    const table = create_table_for_document(cost_by_type_and_currency, aggregated, percentages);
    add_to_header(table)

    setTimeout(compute_and_insert_percentages_table, 2000)
}

function proceed_after_header_appear(){
    let header = document.querySelector('[data-qa-file="BrokerAccountsHeaderPure"]');
    if (header == null){
        // console.log("waiting for a header.");
        setTimeout(proceed_after_header_appear, 1000)
    } else {
        compute_and_insert_percentages_table()
    }
}

proceed_after_header_appear();