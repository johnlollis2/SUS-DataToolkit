document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('drop-area');
    const processButton = document.getElementById('processButton');
    const radarChartDiv = document.getElementById('radarChart');
    const individualScoreChartDiv = document.getElementById('individualScoreChart');
    const interpretationPanelDiv = document.getElementById('interpretationPanel');
    const dataTable = document.getElementById('dataTable').querySelector('tbody');
    const downloadButton = document.getElementById('downloadButton');

    let susData = [];
    let scores = [];

    initializeEventListeners();

    function initializeEventListeners() {
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

        processButton.addEventListener('click', handleFileProcess);
        downloadButton.addEventListener('click', handleDownload);
    }

    function handleFileProcess() {
        try {
            const file = fileInput.files[0];
            if (file) {
                Papa.parse(file, {
                    header: true,
                    complete: function(results) {
                        susData = parseSUSData(results.data);
                        scores = calculateSUSScores(susData);
                        renderBarChart(scores);
                        renderRadarChart(susData);
                        renderBoxPlot(susData, scores);
                        renderInterpretationPanel(scores);
                        renderTable(susData, scores);
                    }
                });
            } else {
                alert('Please select a file to process.');
            }
        } catch (error) {
            alert('Error processing file: ' + error.message);
        }
    }

    function parseSUSData(data) {
        return data.map(row => ({
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
    }

    function calculateSUSScores(data) {
        return data.map(item => {
            const positiveScores = (item.Q1 - 1) + (item.Q3 - 1) + (item.Q5 - 1) + (item.Q7 - 1) + (item.Q9 - 1);
            const negativeScores = (5 - item.Q2) + (5 - item.Q4) + (5 - item.Q6) + (5 - item.Q8) + (5 - item.Q10);
            return (positiveScores + negativeScores) * 2.5;
        });
    }

    function renderBarChart(scores) {
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
            },
            width: 'container',
            height: 'container'
        };

        vegaEmbed('#individualScoreChart', barChartSpec).catch(console.error);
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
            },
            width: 'container',
            height: 'container'
        };

        vegaEmbed('#radarChart', radarChartSpec).catch(console.error);
    }

    function renderBoxPlot(data, scores) {
        // Render your box plot here using Vega-Lite
    }

    function renderInterpretationPanel(scores) {
        const avgScore = average(scores);
        const interpretation = getSUSInterpretation(avgScore);
        interpretationPanelDiv.innerHTML = `
            <h3>Interpretation</h3>
            <p>Average SUS Score: ${avgScore.toFixed(2)}</p>
            <p>${interpretation}</p>
        `;
    }

    function getSUSInterpretation(score) {
        if (score >= 85) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 50) return "OK";
        return "Poor";
    }

    function renderTable(data, scores) {
        dataTable.innerHTML = data.map((row, index) => `
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
            </tr>`).join('');
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function handleDownload() {
        const csvData = susData.map((row, index) => ({
            user: `User ${index + 1}`,
            ...row,
            susScore: scores[index]
        }));

        const csvContent = Papa.unparse(csvData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'SUSData.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
