document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('drop-area');
    const processButton = document.getElementById('processButton');
    const barChartContent = document.getElementById('barChartContent');
    const radarChartContent = document.getElementById('radarChartContent');
    const scoreDistributionContent = document.getElementById('scoreDistributionContent');
    const interpretationPanel = document.getElementById('interpretationPanel');
    const dataTable = document.getElementById('dataTable');
    const downloadButton = document.getElementById('downloadButton');

    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        dropArea.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
        }
    });

    processButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    const susData = results.data.map(row => ({
                        Q1: parseInt(row.Q1),
                        Q2: parseInt(row.Q2),
                        Q3: parseInt(row.Q3),
                        Q4: parseInt(row.Q4),
                        Q5: parseInt(row.Q5),
                        Q6: parseInt(row.Q6),
                        Q7: parseInt(row.Q7),
                        Q8: parseInt(row.Q8),
                        Q9: parseInt(row.Q9),
                        Q10: parseInt(row.Q10)
                    }));

                    const scores = calculateSUSScores(susData);
                    const averageScore = calculateAverageScore(scores);
                    renderBarChart(susData);
                    renderRadarChart(susData);
                    renderScoreDistribution(scores);
                    renderTable(susData, scores);
                    displayInterpretation(averageScore, susData);
                }
            });
        } else {
            alert('Please select a file to process.');
        }
    });

    function calculateSUSScores(data) {
        return data.map(item => {
            const positiveScores = (item.Q1 - 1) + (item.Q3 - 1) + (item.Q5 - 1) + (item.Q7 - 1) + (item.Q9 - 1);
            const negativeScores = (5 - item.Q2) + (5 - item.Q4) + (5 - item.Q6) + (5 - item.Q8) + (5 - item.Q10);
            return (positiveScores + negativeScores) * 2.5;
        });
    }

    function calculateAverageScore(scores) {
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    function renderBarChart(data) {
        const barChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A bar chart of individual SUS scores.',
            data: {
                values: data.flatMap((row, index) => Object.keys(row).map(question => ({
                    user: `User ${index + 1}`,
                    question,
                    score: row[question]
                })))
            },
            mark: 'bar',
            encoding: {
                x: { field: 'question', type: 'ordinal', axis: { title: 'Question' } },
                y: { field: 'score', type: 'quantitative', axis: { title: 'Score' } },
                color: { field: 'user', type: 'nominal' }
            },
            width: 600,
            height: 400
        };

        vegaEmbed('#barChartContent', barChartSpec).catch(console.error);
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

        const radarData = Object.keys(averageScores).map(key => ({ question: key, score: averageScores[key] }));

        const radarChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A radar chart of average SUS question scores.',
            data: {
                values: radarData
            },
            mark: 'line',
            encoding: {
                theta: { field: 'question', type: 'nominal' },
                radius: { field: 'score', type: 'quantitative' }
            },
            width: 600,
            height: 400
        };

        vegaEmbed('#radarChartContent', radarChartSpec).catch(console.error);
    }

    function renderScoreDistribution(scores) {
        const scoreDistributionSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A histogram of SUS score distribution.',
            data: {
                values: scores.map(score => ({ score }))
            },
            mark: 'bar',
            encoding: {
                x: { field: 'score', bin: true, axis: { title: 'SUS Score' } },
                y: { aggregate: 'count', axis: { title: 'Count' } }
            },
            width: 600,
            height: 400
        };

        vegaEmbed('#scoreDistributionContent', scoreDistributionSpec).catch(console.error);
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
                <th>SUS Score</th>
            </tr>
            ${data.map((row, index) => `
                <tr>
                    <td>User ${index + 1}</td>
                    <td>${row.Q1}</td>
                    <td>${row.Q2}</td>
                    <td>${row.Q3}</td>
                    <td>${row.Q4}</td>
                    <td>${row.Q5}</td>
                    <td>${row.Q6}</td>
                    <td>${row.Q7}</td>
                    <td>${row.Q8}</td>
                    <td>${row.Q9}</td>
                    <td>${row.Q10}</td>
                    <td>${scores[index]}</td>
                </tr>`).join('')}
            <tr>
                <td><strong>Average</strong></td>
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

    function displayInterpretation(averageScore, data) {
        const totalAverage = averageScore.toFixed(2);
        interpretationPanel.innerHTML = `
            <p>SUS - Average Score: ${totalAverage}</p>
            <p>The average SUS score is ${totalAverage}.</p>
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

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    downloadButton.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8," + 
            Array.from(dataTable.rows).map(row => Array.from(row.cells).map(cell => cell.innerText).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        setTimeout(() => {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 0);
    });
});