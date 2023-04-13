function bubble_repaymentForecast(properties, context) {
    let dailyRate = properties.rate / 365;
	let repayments = [];
	let prevBalance = Math.abs(properties.loanAmount);
    let prevDate = properties.startingDate;

    function roundNumber(number) {
        const roundedNumber = Math.round(number * 100) / 100;

        return roundedNumber;
    }
    
    function setNewDate(date, offset, frequency) {
        const referenceDate = new Date(date);

        if (frequency === 'monthly') {
            let newMonthlyDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset, referenceDate.getDate());
            
            if (newMonthlyDate.getDate() != referenceDate.getDate()) {
                newMonthlyDate.setDate(0);
                return newMonthlyDate;
            } else {
                return newMonthlyDate;
            }
        } else if (frequency === 'fortnightly') {
            const offsetInDays = offset * 14;
            return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + offsetInDays)
        } else if (frequency === 'weekly') {
            const offsetInDays = offset * 7;
            return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + offsetInDays)
        } else {
            return 'error: frequency not defined'
        }
    }

    for (let i = 1; i <= properties.numberPayments; i++) {
		const newDate = setNewDate(properties.startingDate, i, properties.frequencyPayments);
        const diffTime = Math.abs(newDate - prevDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const newInterest = roundNumber(diffDays * dailyRate * prevBalance);
        const newPrincipal = roundNumber(Math.abs(properties.repaymentAmount) - newInterest);

        if (i === properties.numberPayments) {
            const lastRepaymentAmount = roundNumber(prevBalance + newInterest);
            const lastPrincipal = roundNumber(lastRepaymentAmount - newInterest);
		
            const obj = {
                'id': i,
                'date': new Date(newDate).toLocaleDateString('en-US'),
                'openingBalance': prevBalance,
                'repayment': lastRepaymentAmount,
                'interest': newInterest,
                'principal': lastPrincipal,
                'closingBalance': roundNumber(prevBalance - lastPrincipal)
            }  

            repayments.push(obj);
        } else {
            const obj = {
                'id': i,
                'date': new Date(newDate).toLocaleDateString('en-US'),
                'openingBalance': prevBalance,
                'repayment': Math.abs(properties.repaymentAmount),
                'interest': newInterest,
                'principal': newPrincipal,
                'closingBalance': roundNumber(prevBalance - newPrincipal)
            }

            repayments.push(obj);
        }

        prevBalance = roundNumber(prevBalance - newPrincipal);
        prevDate = newDate;
    }
    
//return the JSON object as a string, because it will be returned as string on Bubble,
//and parsed in the app (using a generic API call)
return {
    returnRepayments: JSON.stringify(repayments)
}
}

console.log(bubble_repaymentForecast(
    {
        rate: 0.35,
        numberPayments: 156,
        frequencyPayments: 'fortnightly',
        loanAmount: 20000,
        repaymentAmount: 306.82,
        startingDate: 1680181200000
    },
    {   

    }
));