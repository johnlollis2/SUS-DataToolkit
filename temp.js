document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const outputDiv = document.getElementById('output');
    const barChartDiv = document.getElementById('barChart');
    const radarChartDiv = document.getElementById('radarChart');
    const heatmapContainer = document.getElementById('heatmapContainer');
    const dataTable = document.getElementById('dataTable');
    const interpretationPanel = document.getElementById('interpretationPanel');
    const downloadButton = document.getElementById('downloadButton');

    let susData = []; // Declare susData globally for access in other functions

    processButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            console.log('File selected:', file); // Debug log
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    console.log('Parsed Results:', results); // Debug log

                    // Check if results data is as expected
                    if (results.data && results.data.length > 0) {
                        susData = results.data.map(row => ({
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

                        console.log('SUS Data:', susData); // Debug log

                        const scores = calculateSUSScores(susData);
                        console.log('SUS Scores:', scores); // Debug log

                        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                        console.log('Average SUS Score:', averageScore); // Debug log

                        outputDiv.innerHTML = `<p>Average SUS Score: ${averageScore.toFixed(2)}</p>`;
                        renderBarChart(scores);
                        renderRadarChart(susData);
                        renderHeatmap(susData);
                        renderTable(susData);
                        updateInterpretationPanel(averageScore, scores);
                    } else {
                        console.error('No valid data found in the file.');
                        alert('No valid data found in the file.');
                    }
                },
                error: function(error) {
                    console.error('Error parsing file:', error); // Debug log
                    alert('Error parsing file. Please check the file format.');
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

    function renderBarChart(scores) {
        console.log('Rendering bar chart with scores:', scores); // Debug log
        const barChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A bar chart of SUS scores.',
            data: {
                values: scores.map((score, index) => ({ user: `User ${index + 1}`, score }))
            },
            mark: 'bar',
            encoding: {
                x: { field: 'user', type: 'ordinal', axis: { title: 'User' } },
                y: { field: 'score', type: 'quantitative', axis: { title: 'SUS Score' } }
            }
        };

        vegaEmbed('#barChart', barChartSpec).catch(console.error);
    }

    function renderRadarChart(data) {
        console.log('Rendering radar chart with data:', data); // Debug log
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

        console.log('Average Scores for Radar Chart:', averageScores); // Debug log

        const radarChartSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A radar chart of average SUS question scores.',
            data: {
                values: Object.keys(averageScores).map(key => ({ question: key, score: averageScores[key] }))
            },
            mark: { type: 'line', point: true },
            encoding: {
                theta: { field: 'question', type: 'nominal', axis: { title: 'Question' } },
                radius: { field: 'score', type: 'quantitative', axis: { title: 'Average Score' } }
            }
        };

        vegaEmbed('#radarChart', radarChartSpec).catch(console.error);
    }

    function renderHeatmap(data) {
        console.log('Rendering heatmap with data:', data); // Debug log
        const values = data.flatMap((user, index) => [
            { user: `User ${index + 1}`, question: 'Q1', score: user.Q1 },
            { user: `User ${index + 1}`, question: 'Q2', score: user.Q2 },
            { user: `User ${index + 1}`, question: 'Q3', score: user.Q3 },
            { user: `User ${index + 1}`, question: 'Q4', score: user.Q4 },
            { user: `User ${index + 1}`, question: 'Q5', score: user.Q5 },
            { user: `User ${index + 1}`, question: 'Q6', score: user.Q6 },
            { user: `User ${index + 1}`, question: 'Q7', score: user.Q7 },
            { user: `User ${index + 1}`, question: 'Q8', score: user.Q8 },
            { user: `User ${index + 1}`, question: 'Q9', score: user.Q9 },
            { user: `User ${index + 1}`, question: 'Q10', score: user.Q10 },
        ]);

        console.log('Heatmap Values:', values); // Debug log

        const heatmapSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A heatmap of SUS responses.',
            data: { values },
            mark: 'rect',
            encoding: {
                x: { field: 'question', type: 'ordinal', axis: { title: 'Question' } },
                y: { field: 'user', type: 'ordinal', axis: { title: 'User' } },
                color: { field: 'score', type: 'quantitative', scale: { scheme: 'blues' }, legend: { title: 'Score' } }
            }
        };

        vegaEmbed('#heatmapContainer', heatmapSpec).catch(console.error);
    }

    function renderTable(data) {
        console.log('Rendering table with data:', data); // Debug log
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
                </tr>`).join('')}
        `;
    }

    function updateInterpretationPanel(averageScore, scores) {
        console.log('Updating interpretation panel with average score:', averageScore, 'and scores:', scores); // Debug log
        interpretationPanel.innerHTML = `
            <h3>Score and Interpretation:</h3>
            <p>SUS Study Score: ${averageScore.toFixed(2)}</p>
            <p>Median: ${median(scores)}</p>
            <p>Standard Dev.: ${standardDeviation(scores).toFixed(2)}</p>
            <p>Adjective: ${getAdjectiveRating(averageScore)}</p>
            <p>Grade: ${getGradeRating(averageScore)}</p>
            <p>Acceptability: ${getAcceptabilityRating(averageScore)}</p>
        `;
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function median(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function standardDeviation(arr) {
        const mean = average(arr);
        return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length);
    }

    function getAdjectiveRating(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Okay';
        return 'Poor';
    }

    function getGradeRating(score) {
        if (score >= 85) return 'A';
        if (score >= 70) return 'B';
        if (score >= 50) return 'C';
        return 'D';
    }

    function getAcceptabilityRating(score) {
        if (score >= 70) return 'Acceptable';
        if (score >= 50) return 'Marginal';
        return 'Not Acceptable';
    }

    downloadButton.addEventListener('click', () => {
        const csvData = Papa.unparse({
            fields: ["User", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10"],
            data: susData.map((row, index) => [
                `User ${index + 1}`, row.Q1, row.Q2, row.Q3, row.Q4, row.Q5, row.Q6, row.Q7, row.Q8, row.Q9, row.Q10
            ])
        });

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sus_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    function openTab(tabName) {
        const tabContents = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].classList.remove('active');
        }
        document.getElementById(tabName).classList.add('active');

        const tabButtons = document.getElementsByClassName('tab-button');
        for (let i = 0; i < tabButtons.length; i++) {
            tabButtons[i].classList.remove('active');
        }
        document.querySelector(`.tab-button[onclick="openTab('${tabName}')"]`).classList.add('active');
    }
});
