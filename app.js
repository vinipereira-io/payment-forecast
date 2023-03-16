function repaymentForecast(rate, numberPayments, frequencyPayments, loanAmount, repaymentAmount, startingDate) {
    let repayments = [];
    let prevBalance = Math.abs(loanAmount);
    let prevDate = startingDate;

    function roundUpCurrency(number) {
        const roundedNumber = Math.ceil(number * 100) / 100;

        return roundedNumber;
    }

    function fixFloatingPoint(number) {
        const fixedString = number.toFixed(2);
        const fixedNumber = parseFloat(fixedString);

        return fixedNumber;
    }

    function setNewDate(date, frequency) {
        const currentDate = new Date(date);

        if (frequency === 'monthly') {
            return currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (frequency === 'fortnightly') {
            return currentDate.setDate(currentDate.getDate() + 14);
        } else if (frequency === 'weekly') {
            return currentDate.setDate(currentDate.getDate() + 7);
        } else {
            return currentDate
        }
    }

    for (let i = 1; i <= numberPayments; i++) {
        const newDate = setNewDate(prevDate, frequencyPayments);
        const newInterest = roundUpCurrency(prevBalance * rate);
        const newPrincipal = fixFloatingPoint(Math.abs(repaymentAmount) - newInterest);

        if (i === numberPayments) {
            const lastRepaymentAmount = roundUpCurrency(prevBalance + newInterest);
            const lastPrincipal = fixFloatingPoint(lastRepaymentAmount - newInterest);

            const obj = {
                'id': i,
                'date': new Date(newDate).toLocaleDateString('en-US'),
                'openingBalance': prevBalance,
                'repayment': lastRepaymentAmount,
                'interest': newInterest,
                'principal': lastPrincipal,
                'closingBalance': fixFloatingPoint(prevBalance - lastPrincipal)
            }  
            //push the JSON object as a string, because it will be returned as string on Bubble,
            //and parsed in the app (using a generic API call)
            repayments.push(obj);
        } else {
            const obj = {
                'id': i,
                'date': new Date(newDate).toLocaleDateString('en-US'),
                'openingBalance': prevBalance,
                'repayment': Math.abs(repaymentAmount),
                'interest': newInterest,
                'principal': newPrincipal,
                'closingBalance': fixFloatingPoint(prevBalance - newPrincipal)
            }

            repayments.push(obj);
        }

        prevBalance = fixFloatingPoint(prevBalance - newPrincipal);
        prevDate = newDate;
    }

    return JSON.stringify(repayments);
}

console.log(repaymentForecast(0.013461538, 52, 'fortnightly', -20000, -537.29, new Date()));