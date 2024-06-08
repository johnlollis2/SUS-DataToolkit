document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('drop-area');
    const processButton = document.getElementById('processButton');
    const radarChartCanvas = document.getElementById('radarChart').getContext('2d');
    const barChartCanvas = document.getElementById('barChart').getContext('2d');
    const boxPlotChartCanvas = document.getElementById('boxPlotChart').getContext('2d');
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
                handleFileProcess(); // Automatically process the file on drop
            }
        });

        fileInput.addEventListener('change', handleFileSelect);
        processButton.addEventListener('click', handleFileProcess);
        downloadButton.addEventListener('click', handleDownload);
    }

    function handleFileSelect(event) {
        if (event.target.files.length > 0) {
            handleFileProcess(); // Automatically process the file on selection
        }
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
                        renderHeatmap(susData);
                        renderBoxPlot(susData);
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
        const data = {
            labels: scores.map((score, index) => `User ${index + 1}`),
            datasets: [{
                label: 'SUS Score',
                data: scores,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'User' } },
                    y: { title: { display: true, text: 'SUS Score' } }
                }
            }
        };

        new Chart(barChartCanvas, config);
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

        const labels = Object.keys(averageScores);
        const dataValues = Object.values(averageScores);

        const data = {
            labels: labels,
            datasets: [{
                label: 'Average Score',
                data: dataValues,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };

        const config = {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    r: { 
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 5,
                        beginAtZero: true
                    }
                }
            }
        };

        new Chart(radarChartCanvas, config);
    }

    function renderHeatmap(data) {
        const heatmapData = [];
        data.forEach((row, index) => {
            for (let i = 1; i <= 10; i++) {
                heatmapData.push({ question: `Q${i}`, score: row[`Q${i}`] });
            }
        });

        const heatmapSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A heatmap showing response distribution.',
            data: {
                values: heatmapData
            },
            mark: 'rect',
            encoding: {
                x: { field: 'question', type: 'nominal', axis: { title: 'Question' } },
                y: { field: 'score', type: 'quantitative', bin: true, axis: { title: 'Score' } },
                color: { aggregate: 'count', type: 'quantitative', legend: { title: 'Count' } }
            },
            width: 'container',
            height: 'container'
        };

        vegaEmbed('#heatmapChart', heatmapSpec).catch(console.error);
    }

    function renderBoxPlot(data) {
        const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
        const datasets = labels.map(label => ({
            label: label,
            data: data.map(d => d[label])
        }));

        const config = {
            type: 'boxplot',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Distribution',
                    data: datasets,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Question' } },
                    y: { title: { display: true, text: 'Score' } }
                }
            }
        };

        new Chart(boxPlotChartCanvas, config);
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
