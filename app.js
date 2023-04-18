function bubble_repaymentForecast(properties, context) {

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
            console.log('error: frequency not defined');
        }
    }

    function convertRateToFrequency(rate, frequency) {
        if (frequency === 'monthly') {
            return rate / 12;
        } else if (frequency === 'fortnightly') {
            return rate / 365 * 14;
        } else if (frequency === 'weekly') {
            return rate / 365 * 7;
        } else {
            console.log('error: frequency not defined');
        }
    }

    function calculatePayment(rate, numberPayments, loanAmount) {
        const Finance = require('financejs');
        const finance = new Finance();

        const payment = finance.PMT(rate, numberPayments, -Math.abs(loanAmount));
        const roundedPayment = Math.ceil(payment * 100) / 100;
        
        return roundedPayment
    }

    function setRepaymentForecast(loanAmount, rate, payment, numberPayments, frequencyPayments, establishmentDate, firstRepaymentDate) {
        let dailyRate = rate / 365;
        let repayments = [];
        let prevBalance = Math.abs(loanAmount);
        let prevDate = establishmentDate;
    
        for (let i = 0; i < numberPayments; i++) {
            const newDate = setNewDate(firstRepaymentDate, i, frequencyPayments);
            const diffTime = Math.abs(newDate - prevDate);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const newInterest = roundNumber(diffDays * dailyRate * prevBalance);
            const newPrincipal = roundNumber(Math.abs(payment) - newInterest);
    
            if (i === numberPayments - 1) {
                const lastRepayment = roundNumber(prevBalance + newInterest);
                const lastPrincipal = roundNumber(lastRepayment - newInterest);
            
                const obj = {
                    'id': i + 1,
                    'date': new Date(newDate).toLocaleDateString('en-US'),
                    'openingBalance': prevBalance,
                    'repayment': lastRepayment,
                    'interest': newInterest,
                    'principal': lastPrincipal,
                    'closingBalance': roundNumber(prevBalance - lastPrincipal)
                }  
    
                repayments.push(obj);
            } else {
                const obj = {
                    'id': i + 1,
                    'date': new Date(newDate).toLocaleDateString('en-US'),
                    'openingBalance': prevBalance,
                    'repayment': Math.abs(payment),
                    'interest': newInterest,
                    'principal': newPrincipal,
                    'closingBalance': roundNumber(prevBalance - newPrincipal)
                }
    
                repayments.push(obj);
            }
    
            prevBalance = roundNumber(prevBalance - newPrincipal);
            prevDate = newDate;
        }

        return repayments;
    }

    function adjustMonthlyPayment(originalForecast) {
    
        let lastDate = properties.establishmentDate;
        
        let sumOfProducts = 0;
        
        for (entry of originalForecast) {
            const diffTime = new Date(entry.date) - lastDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
            sumOfProducts += diffDays * entry.interest;
        
            lastDate = new Date(entry.date);
        }
        
        let sumOfInterests = 0;
        
        for (entry of originalForecast) {
            sumOfInterests += entry.interest;
        }
        
        const daysPerMonth = sumOfProducts / sumOfInterests;

        const adjustedMonthlyRate = properties.rate / 365 * daysPerMonth;

        const adjustedPayment = calculatePayment(adjustedMonthlyRate, properties.numberPayments, properties.loanAmount)

        return adjustedPayment;        
    }

const convertedRate = convertRateToFrequency(properties.rate, properties.frequencyPayments);

let payment = calculatePayment(convertedRate, properties.numberPayments, properties.loanAmount);

let repaymentForecast = setRepaymentForecast(properties.loanAmount, properties.rate, payment, properties.numberPayments, properties.frequencyPayments, properties.establishmentDate, properties.firstRepaymentDate);

if (properties.frequencyPayments === 'monthly') {
    payment = adjustMonthlyPayment(repaymentForecast);

    repaymentForecast = setRepaymentForecast(properties.loanAmount, properties.rate, payment, properties.numberPayments, properties.frequencyPayments, properties.establishmentDate, properties.firstRepaymentDate);
}

//return the JSON object as a string, because it will be returned as string on Bubble,
//and parsed in the app (using a generic API call)
return {
    returnRepayment: payment,
    returnRepaymentForecast: JSON.stringify(repaymentForecast)
}
}

console.log(bubble_repaymentForecast(
        {
            rate: 0.35,
            numberPayments: 12,
            frequencyPayments: 'monthly',
            loanAmount: 20000,
            establishmentDate: 1681740000000,
            firstRepaymentDate: 1682863200000,
        },
        {   

        }
    ))