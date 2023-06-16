function bubble_repaymentForecast(properties, context) {
    function roundNumber(number) {
        const roundedNumber = Math.ceil(number * 100) / 100;

        return roundedNumber;
    }

    function calculateDays(startDate, endDate) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
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

    function calculatePayment(interestRate, periods, presentValue, type = 0) {
    // Calculate the PMT
    var payment = (presentValue * interestRate) / (1 - Math.pow(1 + interestRate, -periods));
  
    // Adjust the result based on the payment type (beginning or end of the period)
    if (type === 1) {
        payment = payment / (1 + interestRate);
    }

    let roundedPayment = roundNumber(payment)
  
    return roundedPayment;
    }

    function setRepaymentForecast(loanAmount, dailyRate, payment, numberPayments, frequencyPayments, establishmentDate, firstRepaymentDate) {
        let repayments = [];
        let prevBalance = Math.abs(loanAmount);
        let prevDate = establishmentDate;
    
        for (let i = 0; i < numberPayments; i++) {
            const newDate = setNewDate(firstRepaymentDate, i, frequencyPayments);
            const diffDays = calculateDays(prevDate, newDate);
            const newInterest = roundNumber(diffDays * dailyRate * prevBalance);
            const newPrincipal = roundNumber(Math.abs(payment) - newInterest);
    
            if (i === numberPayments - 1) {
                const lastRepayment = roundNumber(prevBalance + newInterest);
                const lastPrincipal = roundNumber(lastRepayment - newInterest);
            
                const obj = {
                    '_p_id': i + 1,
                    '_p_date': new Date(newDate).toLocaleDateString('en-US'),
                    '_p_openingBalance': prevBalance,
                    '_p_repayment': lastRepayment,
                    '_p_interest': newInterest,
                    '_p_principal': lastPrincipal,
                    '_p_closingBalance': roundNumber(prevBalance - lastPrincipal)
                }  
    
                repayments.push(obj);
            } else {
                const obj = {
                    '_p_id': i + 1,
                    '_p_date': new Date(newDate).toLocaleDateString('en-US'),
                    '_p_openingBalance': prevBalance,
                    '_p_repayment': Math.abs(payment),
                    '_p_interest': newInterest,
                    '_p_principal': newPrincipal,
                    '_p_closingBalance': roundNumber(prevBalance - newPrincipal)
                }
    
                repayments.push(obj);
            }
    
            prevBalance = roundNumber(prevBalance - newPrincipal);
            prevDate = newDate;
        }

        return repayments;
    }

    function adjustPayment(originalForecast) {
        let lastDate = firstRepaymentDate;
        
        //We don't want to use the gap between establishment date and first repayment date in our weighted average
        originalForecast.splice(0, 1);
        
        let sumOfProducts = 0;
        
        for (entry of originalForecast) {
            const diffDays = calculateDays(lastDate, new Date(entry._p_date));
        
            sumOfProducts += diffDays * entry._p_interest;
        
            lastDate = new Date(entry._p_date);
        }
        
        let sumOfInterests = 0;
        
        for (entry of originalForecast) {
            sumOfInterests += entry._p_interest;
        }
        
        const daysPerEntry = sumOfProducts / sumOfInterests;

        const adjustedRate = properties.rate / 365 * daysPerEntry;

        const adjustedPayment = calculatePayment(adjustedRate, properties.numberPayments, presentValue, 1)

        return adjustedPayment;        
    }

const establishmentDate = new Date(properties.establishmentDate);
const firstRepaymentDate = new Date(properties.firstRepaymentDate);
const convertedRate = convertRateToFrequency(properties.rate, properties.frequencyPayments);
const dailyRate = properties.rate / 365

let presentValue = properties.loanAmount;

presentValue += roundNumber(calculateDays(establishmentDate, firstRepaymentDate) * dailyRate * presentValue)

let payment = calculatePayment(convertedRate, properties.numberPayments, presentValue, 1);

let repaymentForecast = setRepaymentForecast(properties.loanAmount, dailyRate, payment, properties.numberPayments, properties.frequencyPayments, establishmentDate, firstRepaymentDate);

if (properties.frequencyPayments === 'monthly') {
    payment = adjustPayment(repaymentForecast);

    repaymentForecast = setRepaymentForecast(properties.loanAmount, dailyRate, payment, properties.numberPayments, properties.frequencyPayments, establishmentDate, firstRepaymentDate);
}

return {
    returnRepayment: payment,
    returnRepaymentForecast: repaymentForecast
}
}

console.log(bubble_repaymentForecast(
        {
            rate: 0.375,
            numberPayments: 130,
            frequencyPayments: 'monthly',
            loanAmount: 16500,
            establishmentDate: '2023-05-31',
            firstRepaymentDate: '2023-06-30', //maximum 30 days diff
        },
        {   

        }
    ).returnRepaymentForecast[129])