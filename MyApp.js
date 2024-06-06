document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const processFileButton = document.getElementById('processFile');
    const downloadButton = document.getElementById('downloadButton');
    const radarChartContainer = document.getElementById('radarChart');
    const barChartContainer = document.getElementById('barChart');
    const interpretationPanel = document.getElementById('interpretationPanel');
    const dataTable = document.getElementById('dataTable');
    
    let data = [];
    let scores = [];
    let averageScores = {};
    
    processFileButton.addEventListener('click', function () {
        if (fileInput.files.length === 0) {
            alert('Please select a file!');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            const csvData = event.target.result;
            const rows = csvData.split('\n').map(row => row.split(','));
            const headers = rows[0];
            data = rows.slice(1).map(row => {
                return headers.reduce((obj, header, index) => {
                    obj[header] = parseFloat(row[index]);
                    return obj;
                }, {});
            });
            processData(data);
            updateTable(data);
            renderCharts();
        };
        reader.readAsText(file);
    });
    
    function processData(data) {
        scores = data.map(item => calculateSUSScore(item));
        averageScores = calculateAverageScores(data);
    }
    
    function calculateSUSScore(item) {
        return ((item.Q1 + item.Q2 + item.Q3 + item.Q4 + item.Q5 + item.Q6 + item.Q7 + item.Q8 + item.Q9 + item.Q10) / 10) * 2.5;
    }
    
    function calculateAverageScores(data) {
        const totals = data.reduce((totals, item) => {
            Object.keys(item).forEach(key => {
                totals[key] = (totals[key] || 0) + item[key];
            });
            return totals;
        }, {});
        const averages = {};
        Object.keys(totals).forEach(key => {
            averages[key] = totals[key] / data.length;
        });
        return averages;
    }

    function renderCharts() {
        renderRadarChart();
        renderBarChart();
        updateInterpretationPanel();
    }

    function renderRadarChart() {
        const radarSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": [
                    {"question": "Q1", "score": averageScores.Q1},
                    {"question": "Q2", "score": averageScores.Q2},
                    {"question": "Q3", "score": averageScores.Q3},
                    {"question": "Q4", "score": averageScores.Q4},
                    {"question": "Q5", "score": averageScores.Q5},
                    {"question": "Q6", "score": averageScores.Q6},
                    {"question": "Q7", "score": averageScores.Q7},
                    {"question": "Q8", "score": averageScores.Q8},
                    {"question": "Q9", "score": averageScores.Q9},
                    {"question": "Q10", "score": averageScores.Q10}
                ]
            },
            "mark": "line",
            "encoding": {
                "theta": {"field": "question", "type": "nominal"},
                "radius": {"field": "score", "type": "quantitative"}
            }
        };
        vegaEmbed('#radarChart', radarSpec);
    }

    function renderBarChart() {
        const barSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": scores.map((score, index) => ({ "user": `User ${index + 1}`, "score": score }))
            },
            "mark": "bar",
            "encoding": {
                "x": {"field": "user", "type": "nominal"},
                "y": {"field": "score", "type": "quantitative"}
            }
        };
        vegaEmbed('#barChart', barSpec);
    }
    
    function updateInterpretationPanel() {
        const averageSUSScore = average(scores).toFixed(2);
        interpretationPanel.innerHTML = `<h3>SUS - Average Score: ${averageSUSScore}</h3>`;
    }
    
    function updateTable(data) {
        dataTable.innerHTML = `
            <tr>
                <th>User</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Q4</th>
                <th>Q5</th>
                <th>Q6</th>
                <th>Q7</th>
                <th>Q8</th>
                <th>Q9</th>
                <th>Q10</th>
                <th>Average Score</th>
            </tr>
            ${data.map((item, index) => `
                <tr>
                    <td>User ${index + 1}</td>
                    <td>${item.Q1}</td>
                    <td>${item.Q2}</td>
                    <td>${item.Q3}</td>
                    <td>${item.Q4}</td>
                    <td>${item.Q5}</td>
                    <td>${item.Q6}</td>
                    <td>${item.Q7}</td>
                    <td>${item.Q8}</td>
                    <td>${item.Q9}</td>
                    <td>${item.Q10}</td>
                    <td>${scores[index]}</td>
                </tr>
            `).join('')}
            <tr>
                <td>Average</td>
                <td>${averageScores.Q1.toFixed(2)}</td>
                <td>${averageScores.Q2.toFixed(2)}</td>
                <td>${averageScores.Q3.toFixed(2)}</td>
                <td>${averageScores.Q4.toFixed(2)}</td>
                <td>${averageScores.Q5.toFixed(2)}</td>
                <td>${averageScores.Q6.toFixed(2)}</td>
                <td>${averageScores.Q7.toFixed(2)}</td>
                <td>${averageScores.Q8.toFixed(2)}</td>
                <td>${averageScores.Q9.toFixed(2)}</td>
                <td>${averageScores.Q10.toFixed(2)}</td>
                <td>${average(scores).toFixed(2)}</td>
            </tr>
        `;
    }

    function average(arr) {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }
    
    downloadButton.addEventListener('click', function () {
        const csvContent = data.map((item, index) => 
            `User ${index + 1},${item.Q1},${item.Q2},${item.Q3},${item.Q4},${item.Q5},${item.Q6},${item.Q7},${item.Q8},${item.Q9},${item.Q10},${scores[index].toFixed(2)}`
        ).join('\n');
        const averageRow = `Average,${averageScores.Q1.toFixed(2)},${averageScores.Q2.toFixed(2)},${averageScores.Q3.toFixed(2)},${averageScores.Q4.toFixed(2)},${averageScores.Q5.toFixed(2)},${averageScores.Q6.toFixed(2)},${averageScores.Q7.toFixed(2)},${averageScores.Q8.toFixed(2)},${averageScores.Q9.toFixed(2)},${averageScores.Q10.toFixed(2)},${average(scores).toFixed(2)}`;
        const csvHeader = 'User,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10,Average Score';
        const csvData = `${csvHeader}\n${csvContent}\n${averageRow}`;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'SUS_Scores.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});