document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const processFileButton = document.getElementById('processFile');
    const downloadButton = document.getElementById('downloadButton');
    const radarChart = document.getElementById('radarChart');
    const barChart = document.getElementById('barChart');
    const interpretationPanel = document.getElementById('interpretationPanel');
    const dataTable = document.getElementById('dataTable');

    processFileButton.addEventListener('click', function () {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = parseCSV(e.target.result);
                const scores = calculateScores(data);
                renderRadarChart(data);
                renderBarChart(scores);
                displayInterpretation(average(scores));
                renderTable(data, scores);
            };
            reader.readAsText(file);
        }
    });

    function parseCSV(data) {
        const rows = data.split('\n');
        const headers = rows[0].split(',');
        const result = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = parseFloat(values[index].trim());
            });
            return obj;
        });
        return result;
    }

    function calculateScores(data) {
        return data.map(row => {
            return (row.Q1 + row.Q2 + row.Q3 + row.Q4 + row.Q5 + row.Q6 + row.Q7 + row.Q8 + row.Q9 + row.Q10) / 10;
        });
    }

    function renderRadarChart(data) {
        const averageScores = {
            Q1: average(data.map(item => item.Q1)),
            Q2: average(data.map(item => item.Q2)),
            Q3: average(data.map(item => item.Q3)),
            Q4: average(data.map(item => item.Q4)),
            Q5: average(data.map(item => item.Q5)),
            Q6: average(data.map(item => item.Q6)),
            Q7: average(data.map(item => item.Q7)),
            Q8: average(data.map(item => item.Q8)),
            Q9: average(data.map(item => item.Q9)),
            Q10: average(data.map(item => item.Q10))
        };

        const radarData = {
            values: Object.values(averageScores),
            labels: Object.keys(averageScores),
            type: 'radar'
        };

        const radarSpec = {
            data: { values: [radarData] },
            mark: 'line',
            encoding: {
                theta: { field: 'labels', type: 'nominal' },
                radius: { field: 'values', type: 'quantitative' }
            },
            width: 400,
            height: 400
        };

        vegaEmbed('#radarChart', radarSpec).catch(console.error);
    }

    function renderBarChart(scores) {
        const scoreData = scores.map((score, index) => ({ user: `User ${index + 1}`, score }));

        const barChartSpec = {
            data: { values: scoreData },
            mark: 'bar',
            encoding: {
                x: { field: 'user', type: 'nominal', axis: { title: 'User' } },
                y: { field: 'score', type: 'quantitative', axis: { title: 'SUS Score' } }
            },
            width: 400,
            height: 400
        };

        vegaEmbed('#barChart', barChartSpec).catch(console.error);
    }

    function displayInterpretation(averageScore) {
        interpretationPanel.innerHTML = `
            <h3>SUS - Average Score: ${averageScore.toFixed(2)}</h3>
            <p>The average SUS score is ${averageScore.toFixed(2)}.</p>
            <p>A score above 68 is considered above average, while a score below 68 is considered below average.</p>
            <p>Score Ranges:
                <ul>
                    <li>0-25: Poor</li>
                    <li>26-50: OK</li>
                    <li>51-75: Good</li>
                    <li>76-100: Excellent</li>
                </ul>
            </p>
            <p>Percentiles:
                <ul>
                    <li>Top 10%: Excellent</li>
                    <li>Top 30%: Good</li>
                    <li>Bottom 30%: OK</li>
                    <li>Bottom 10%: Poor</li>
                </ul>
            </p>
        `;
    }

    function renderTable(data, scores) {
        const averageScores = {
            Q1: average(data.map(item => item.Q1)),
            Q2: average(data.map(item => item.Q2)),
            Q3: average(data.map(item => item.Q3)),
            Q4: average(data.map(item => item.Q4)),
            Q5: average(data.map(item => item.Q5)),
            Q6: average(data.map(item => item.Q6)),
            Q7: average(data.map(item => item.Q7)),
            Q8: average(data.map(item => item.Q8)),
            Q9: average(data.map(item => item.Q9)),
            Q10: average(data.map(item => item.Q10))
        };

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
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    downloadButton.addEventListener('click', function () {
        const csvContent = `data:text/csv;charset=utf-8,${[...dataTable.rows].map(e => [...e.cells].map(e => e.innerText).join(",")).join("\n")}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "SUS_data.csv");
        document.body.appendChild(link);
        link.click();
    });
});
