document.addEventListener('DOMContentLoaded', () => {
    const chartElements = {
        radarChartCtx: document.getElementById('radarChart').getContext('2d'),
        barChartCtx: document.getElementById('barChart').getContext('2d'),
        lineChartCtx: document.getElementById('lineChart').getContext('2d'),
        boxPlotChartCtx: document.getElementById('boxPlotChart').getContext('2d'),
        histogramChartCtx: document.getElementById('histogramChart').getContext('2d'),
        groupedBarChartCtx: document.getElementById('groupedBarChart').getContext('2d')
    };

    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('drop-area');

    let uploadedFile = null;
    let data = [];
    let convertedData = [];
    let susScores = [];
    let charts = {};

    // Event Listeners
    fileInput.addEventListener('change', handleFileUpload);
    document.getElementById('processButton').addEventListener('click', processFile);
    document.getElementById('removeFileButton').addEventListener('click', removeFile);
    document.getElementById('resetButton').addEventListener('click', resetCharts);
    document.getElementById('reportForm').addEventListener('submit', generateReport);

    setupSidebarListeners();
    setupDragAndDrop();
    setupAccordion();

    function setupSidebarListeners() {
        document.querySelector('.sidebar-list-item:nth-child(1)').addEventListener('click', () => showTab('chartsTab'));
        document.querySelector('.sidebar-list-item:nth-child(2)').addEventListener('click', () => showTab('dataTableTab'));
    }

    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);
    }

    function setupAccordion() {
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', () => {
                const isActive = button.classList.contains('active');
                document.querySelectorAll('.accordion-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.accordion-content').forEach(content => content.style.display = 'none');

                if (!isActive) {
                    button.classList.add('active');
                    const content = button.nextElementSibling;
                    content.style.display = "block";
                }
            });
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        handleFiles(e.dataTransfer.files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file && file.type === 'text/csv') {
                uploadedFile = file;
                document.getElementById('fileInfo').textContent = `File: ${file.name}`;
                document.getElementById('removeFileButton').style.display = 'block';
            } else {
                displayInvalidFileMessage();
            }
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            uploadedFile = file;
            document.getElementById('fileInfo').textContent = `File: ${file.name}`;
            document.getElementById('removeFileButton').style.display = 'block';
        } else {
            displayInvalidFileMessage();
        }
    }

    function displayInvalidFileMessage() {
        document.getElementById('fileInfo').textContent = "Please select a valid CSV file.";
        document.getElementById('removeFileButton').style.display = 'none';
        uploadedFile = null;
    }

    function processFile() {
        if (!uploadedFile) {
            alert("Please upload a CSV file first.");
            return;
        }

        Papa.parse(uploadedFile, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                if (results.errors.length) {
                    console.error("Errors in CSV parsing:", results.errors);
                    alert("Error parsing file. Please check the CSV format.");
                    return;
                }

                data = results.data;
                if (!data || data.length === 0) {
                    alert("CSV file is empty or not properly formatted.");
                    return;
                }

                convertedData = data.map(convertToAdjustedData);
                susScores = calculateSUSScores(convertedData);
                if (!susScores) {
                    alert("Error calculating SUS scores. Please check the data format.");
                    return;
                }

                console.log('Converted Data:', convertedData);
                console.log('SUS Scores:', susScores);

                updateDataTable(convertedData, susScores);
                renderCharts(convertedData, susScores);
                updateInterpretation(susScores);
                showTab('chartsTab');
            },
            error: function(error) {
                console.error("Error parsing file:", error);
                alert("Error parsing file. Please try again.");
            }
        });
    }

    function convertToAdjustedData(item) {
        return {
            Q1: item.Q1 - 1,
            Q2: 5 - item.Q2,
            Q3: item.Q3 - 1,
            Q4: 5 - item.Q4,
            Q5: item.Q5 - 1,
            Q6: 5 - item.Q6,
            Q7: item.Q7 - 1,
            Q8: 5 - item.Q8,
            Q9: item.Q9 - 1,
            Q10: 5 - item.Q10
        };
    }

    function calculateSUSScores(data) {
        try {
            return data.map(item => {
                const positiveScores = (item.Q1) + (item.Q3) + (item.Q5) + (item.Q7) + (item.Q9);
                const negativeScores = (item.Q2) + (item.Q4) + (item.Q6) + (item.Q8) + (item.Q10);
                return (positiveScores + negativeScores) * 2.5;
            });
        } catch (error) {
            console.error("Error calculating SUS scores:", error);
            return null;
        }
    }

    function updateDataTable(data, scores) {
        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = "";
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            const userCell = document.createElement('td');
            userCell.textContent = `User ${index + 1}`;
            tr.appendChild(userCell);

            for (let i = 1; i <= 10; i++) {
                const cell = document.createElement('td');
                cell.textContent = row[`Q${i}`].toFixed(2);
                tr.appendChild(cell);
            }

            const scoreCell = document.createElement('td');
            scoreCell.textContent = scores[index].toFixed(2);
            tr.appendChild(scoreCell);

            tbody.appendChild(tr);
        });

        addAverageRow(data, scores);
        checkTableData();
    }

    function addAverageRow(data, scores) {
        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        const tr = document.createElement('tr');
        const avgCell = document.createElement('td');
        avgCell.textContent = 'Average';
        tr.appendChild(avgCell);

        for (let i = 1; i <= 10; i++) {
            const avgConvertedScore = average(data.map(item => item[`Q${i}`]));
            const convertedCell = document.createElement('td');
            convertedCell.textContent = avgConvertedScore.toFixed(2);
            tr.appendChild(convertedCell);
        }

        const avgSUSScore = average(scores);
        const avgSUSCell = document.createElement('td');
        avgSUSCell.textContent = avgSUSScore.toFixed(2);
        tr.appendChild(avgSUSCell);

        tbody.appendChild(tr);
    }

    function renderCharts(data, scores) {
        // Destroy existing charts if any
        Object.values(charts).forEach(chart => chart.destroy());

        // Render charts
        charts.barChart = renderBarChart(scores, data);
        charts.radarChart = renderRadarChart(data);
        charts.lineChart = renderLineChart(data);
        charts.boxPlotChart = renderBoxPlotChart(scores);
        charts.histogramChart = renderHistogram(scores);
        charts.groupedBarChart = renderGroupedBarChart(data);
    }

    function renderBarChart(scores, data) {
        const averageScores = data.map(user => {
            const questionScores = Object.values(user).map(val => val * 2.5);
            return average(questionScores);
        });

        return new Chart(chartElements.barChartCtx, {
            type: 'bar',
            data: {
                labels: scores.map((_, index) => `User ${index + 1}`),
                datasets: [
                    {
                        label: 'SUS Score',
                        data: scores,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Average Score',
                        data: averageScores,
                        type: 'line',
                        fill: false,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        tension: 0.1,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        showLine: true,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'SUS Score'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            callback: function(value) {
                                return [0, 50, 100].includes(value) ? value : '';
                            },
                            stepSize: 50, // Only show 0, 50, and 100
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'User'
                        },
                        grid: {
                            display: false // grid lines
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                if (tooltipItem.datasetIndex === 1) {
                                    return `Average Score: ${tooltipItem.raw.toFixed(2)}`;
                                }
                                return `SUS Score: ${tooltipItem.raw.toFixed(2)}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 50,
                                yMax: 50,
                                borderColor: 'rgba(255, 165, 0, 0.8)',
                                borderWidth: 2,
                                label: {
                                    content: 'Marginal Acceptability',
                                    enabled: true,
                                    position: 'center'
                                }
                            },
                            line2: {
                                type: 'line',
                                yMin: 70,
                                yMax: 70,
                                borderColor: 'rgba(60, 179, 113, 0.8)',
                                borderWidth: 2,
                                label: {
                                    content: 'Acceptability Threshold',
                                    enabled: true,
                                    position: 'center'
                                }
                            }
                        }
                    }
                },
                onClick: (e) => {
                    const activePoints = charts.barChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                    if (activePoints.length > 0) {
                        const index = activePoints[0].index;
                        const userScore = scores[index];
                        alert(`User ${index + 1} SUS Score: ${userScore.toFixed(2)}\nAverage Score: ${averageScores[index].toFixed(2)}`);
                        filterDataByUser(index + 1);
                    }
                }
            }
        });
    }

    function renderBoxPlotChart(scores) {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        return new Chart(chartElements.boxPlotChartCtx, {
            type: 'boxplot',
            data: {
                labels: ['SUS Scores'],
                datasets: [
                    {
                        label: 'SUS Scores',
                        data: [scores],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        maxBarThickness: 60, 
                        minBarLength: 10 
                    },
                    {
                        label: 'Mean Score',
                        type: 'scatter',
                        data: [{ x: 'SUS Scores', y: avgScore }],
                        backgroundColor: 'rgba(255, 99, 132, 1)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'SUS Scores'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            callback: function(value) {
                                return [0, 50, 100].includes(value) ? value : '';
                            },
                            stepSize: 50 // Only show 0, 50, and 100
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'SUS Scores'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            display: false // Hide x-axis labels
                        }
                    }
                }
            }
        });
    }

    function calculateQuantile(arr, q) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if ((sorted[base + 1] !== undefined)) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    }

    function calculateMode(arr) {
        const frequency = {};
        let maxFreq = 0;
        let mode = [];

        arr.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = [value];
            } else if (frequency[value] === maxFreq) {
                mode.push(value);
            }
        });

        return mode.length === arr.length ? [] : mode; // Return empty if no mode
    }

    function renderRadarChart(data) {
        const medianScores = {
            Q1: calculateMedian(data.map(item => item.Q1)),
            Q2: calculateMedian(data.map(item => item.Q2)),
            Q3: calculateMedian(data.map(item => item.Q3)),
            Q4: calculateMedian(data.map(item => item.Q4)),
            Q5: calculateMedian(data.map(item => item.Q5)),
            Q6: calculateMedian(data.map(item => item.Q6)),
            Q7: calculateMedian(data.map(item => item.Q7)),
            Q8: calculateMedian(data.map(item => item.Q8)),
            Q9: calculateMedian(data.map(item => item.Q9)),
            Q10: calculateMedian(data.map(item => item.Q10))
        };

        const modeScores = {
            Q1: calculateMode(data.map(item => item.Q1))[0] || 0,
            Q2: calculateMode(data.map(item => item.Q2))[0] || 0,
            Q3: calculateMode(data.map(item => item.Q3))[0] || 0,
            Q4: calculateMode(data.map(item => item.Q4))[0] || 0,
            Q5: calculateMode(data.map(item => item.Q5))[0] || 0,
            Q6: calculateMode(data.map(item => item.Q6))[0] || 0,
            Q7: calculateMode(data.map(item => item.Q7))[0] || 0,
            Q8: calculateMode(data.map(item => item.Q8))[0] || 0,
            Q9: calculateMode(data.map(item => item.Q9))[0] || 0,
            Q10: calculateMode(data.map(item => item.Q10))[0] || 0
        };

        return new Chart(chartElements.radarChartCtx, {
            type: 'radar',
            data: {
                labels: Object.keys(medianScores),
                datasets: [
                    {
                        label: 'Median Score',
                        data: Object.values(medianScores),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Mode Score',
                        data: Object.values(modeScores),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        grid: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 5,
                        title: {
                            display: true,
                            text: 'Scores'
                        }
                    }
                }
            }
        });
    }

    function calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function renderLineChart(data) {
        const lineChartData = [];
        data.forEach((row, index) => {
            for (let i = 1; i <= 10; i++) {
                lineChartData.push({ x: i, y: row[`Q${i}`], user: index + 1 });
            }
        });

        const datasets = data.map((_, index) => ({
            label: `User ${index + 1}`,
            data: lineChartData.filter(d => d.user === index + 1).map(d => d.y),
            fill: false,
            borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
            tension: 0.1
        }));

        console.log('Line Chart Data:', lineChartData);
        console.log('Line Chart Datasets:', datasets);

        return new Chart(chartElements.lineChartCtx, {
            type: 'line',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Question'
                        },
                        grid: {
                            display: false // grid lines
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            stepSize: 1 // Show only 1, 2, 3, 4, 5
                        }
                    }
                }
            }
        });
    }

    function renderHistogram(scores) {
        const susScoreRanges = [
            { range: '0-19', label: 'Worst Imaginable', color: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)' },
            { range: '20-39', label: 'Poor', color: 'rgba(255, 159, 64, 0.2)', borderColor: 'rgba(255, 159, 64, 1)' },
            { range: '40-59', label: 'OK', color: 'rgba(255, 205, 86, 0.2)', borderColor: 'rgba(255, 205, 86, 1)' },
            { range: '60-79', label: 'Good', color: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)' },
            { range: '80-100', label: 'Excellent/Best Imaginable', color: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)' }
        ];

        const labels = susScoreRanges.map(item => item.range);
        const histogramDataWithLabels = susScoreRanges.map(item => {
            const [min, max] = item.range.split('-').map(Number);
            return scores.filter(score => score >= min && score <= max).length;
        });

        console.log('Histogram Labels:', labels);
        console.log('Histogram Data with Labels:', histogramDataWithLabels);

        return new Chart(chartElements.histogramChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'SUS Score Distribution',
                    data: histogramDataWithLabels,
                    backgroundColor: susScoreRanges.map(item => item.color),
                    borderColor: susScoreRanges.map(item => item.borderColor),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            stepSize: 5 
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'SUS Score Range (Adjective Rating)'
                        },
                        grid: {
                            display: false // grid lines
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            generateLabels: function(chart) {
                                return susScoreRanges.map((item, index) => ({
                                    text: item.label,
                                    fillStyle: item.color,
                                    strokeStyle: item.borderColor,
                                    lineWidth: 1,
                                    index: index
                                }));
                            }
                        }
                    }
                }
            }
        });
    }

    function renderGroupedBarChart(data) {
        const positiveQuestions = ['Q1', 'Q3', 'Q5', 'Q7', 'Q9'];
        const negativeQuestions = ['Q2', 'Q4', 'Q6', 'Q8', 'Q10'];

        const positiveScores = positiveQuestions.map(q => average(data.map(item => item[q])));
        const negativeScores = negativeQuestions.map(q => average(data.map(item => item[q])));

        console.log('Grouped Bar Chart Positive Scores:', positiveScores);
        console.log('Grouped Bar Chart Negative Scores:', negativeScores);

        return new Chart(chartElements.groupedBarChartCtx, {
            type: 'bar',
            data: {
                labels: positiveQuestions.concat(negativeQuestions),
                datasets: [
                    {
                        label: 'Positive Questions',
                        data: positiveScores.concat(Array(5).fill(null)),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Negative Questions',
                        data: Array(5).fill(null).concat(negativeScores),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Score'
                        },
                        grid: {
                            display: false // grid lines
                        },
                        ticks: {
                            stepSize: 1 // Show only 1, 2, 3, 4, 5
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Question'
                        },
                        grid: {
                            display: false // grid lines
                        }
                    }
                }
            }
        });
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function updateInterpretation(scores) {
        const averageScore = average(scores);
        const median = calculateMedian(scores);
        const stdDev = calculateStandardDeviation(scores);
        const adjective = calculateAdjectiveRating(averageScore);
        const grade = calculateGrade(averageScore);
        const acceptability = calculateAcceptability(averageScore);

        document.querySelector('.interpretation-panel').innerHTML = `
            <h3>Interpretation</h3>
            <p>SUS Score: ${averageScore.toFixed(2)}</p>
            <p>Median: ${median.toFixed(2)}</p>
            <p>Standard Deviation: ${stdDev.toFixed(2)}</p>
            <p>Adjective Rating: <span style="color: ${getAdjectiveColor(adjective)}">${adjective}</span></p>
            <p>Grade: ${grade}</p>
            <p>Acceptability: ${acceptability}</p>
        `;
    }

    function calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function calculateStandardDeviation(arr) {
        const avg = average(arr);
        const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    function calculateAdjectiveRating(score) {
        if (score >= 85) return 'Excellent/Best Imaginable';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Kinda liked it';
        if (score >= 35) return 'Poor';
        return 'Worst Imaginable';
    }

    function calculateGrade(score) {
        if (score >= 85) return 'A';
        if (score >= 70) return 'B';
        if (score >= 50) return 'C';
        if (score >= 35) return 'D';
        return 'F';
    }

    function calculateAcceptability(score) {
        if (score >= 70) return 'Acceptable';
        if (score >= 50) return 'Marginal';
        return 'Not Acceptable';
    }

    function getAdjectiveColor(adjective) {
        switch (adjective) {
            case 'Worst Imaginable': return 'rgba(255, 99, 132, 1)';
            case 'Poor': return 'rgba(255, 159, 64, 1)';
            case 'OK': return 'rgba(255, 205, 86, 1)';
            case 'Good': return 'rgba(75, 192, 192, 1)';
            case 'Excellent/Best Imaginable': return 'rgba(54, 162, 235, 1)';
            default: return '#000000';
        }
    }

    function removeFile() {
        document.getElementById('fileInput').value = "";
        document.getElementById('fileInfo').textContent = "";
        document.getElementById('removeFileButton').style.display = 'none';
        uploadedFile = null;
        resetCharts();
        updateInterpretation([]);
        document.getElementById('dataTable').getElementsByTagName('tbody')[0].innerHTML = '';
        checkTableData();
    }

    function showTab(tabId) {
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            if (tab.id === tabId) {
                tab.style.display = 'block';
            } else {
                tab.style.display = 'none';
            }
        });

        if (tabId === 'dataTableTab') {
            checkTableData();
        }
    }

    function checkTableData() {
        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        const noDataMessage = document.getElementById('noDataMessage');
        noDataMessage.style.display = (tbody.rows.length === 0) ? 'block' : 'none';
    }

    // Setup Download and Reset Buttons
    setupDownloadAndResetButtons();

    function setupDownloadAndResetButtons() {
        document.getElementById('downloadBarChartBtn').addEventListener('click', () => downloadChart('barChart', 'IndividualSUSScores.png'));
        document.getElementById('downloadRadarChartBtn').addEventListener('click', () => downloadChart('radarChart', 'AverageScoresPerQuestion.png'));
        document.getElementById('downloadLineChartBtn').addEventListener('click', () => downloadChart('lineChart', 'ScoresAcrossQuestions.png'));
        document.getElementById('downloadBoxPlotChartBtn').addEventListener('click', () => downloadChart('boxPlotChart', 'SUSScoring.png'));
        document.getElementById('downloadHistogramChartBtn').addEventListener('click', () => downloadChart('histogramChart', 'SUSScoreDistribution.png'));
        document.getElementById('downloadGroupedBarChartBtn').addEventListener('click', () => downloadChart('groupedBarChart', 'PositiveVsNegativeQuestions.png'));
        document.getElementById('downloadCsvBtn').addEventListener('click', downloadCSV);

        document.getElementById('resetBarChartBtn').addEventListener('click', resetCharts);
        document.getElementById('resetRadarChartBtn').addEventListener('click', resetCharts);
        document.getElementById('resetLineChartBtn').addEventListener('click', resetCharts);
        document.getElementById('resetBoxPlotChartBtn').addEventListener('click', resetCharts);
        document.getElementById('resetHistogramChartBtn').addEventListener('click', resetCharts);
        document.getElementById('resetGroupedBarChartBtn').addEventListener('click', resetCharts);
    }

    function resetCharts() {
        renderCharts(convertedData, susScores);
    }

    function downloadChart(chartId, filename) {
        const link = document.createElement('a');
        link.href = document.getElementById(chartId).toDataURL('image/png');
        link.download = filename;
        link.click();
    }

    function downloadCSV() {
        const rows = document.querySelectorAll('#dataTable tr');
        let csvContent = '';
        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const rowContent = Array.from(cols).map(col => col.textContent).join(',');
            csvContent += rowContent + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'SUS_Data.csv';
        link.click();
    }

    function filterDataByUser(userIndex) {
        const filteredData = data.filter((_, index) => index === userIndex - 1);
        const filteredScores = susScores.filter((_, index) => index === userIndex - 1);
        renderCharts(filteredData, filteredScores);
    }

    async function generateReport(event) {
        event.preventDefault(); // Prevent form submission

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const includeSummary = document.querySelector('input[name="include_summary"]').checked;
        const includeMedian = document.querySelector('input[name="include_median"]').checked;
        const includeVisualizations = document.querySelector('input[name="include_visualizations"]').checked;

        let yOffset = 10;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(18);
        doc.text('SUS Analysis Report', pageWidth / 2, yOffset, { align: 'center' });
        yOffset += 20;

        // Calculate overall SUS score
        const overallSUSScore = average(susScores);
        let overallCategory = '';
        let overallColor = '';

        if (overallSUSScore >= 70) {
            overallCategory = 'Liked it';
            overallColor = '#00FF00'; // Green
        } else if (overallSUSScore >= 50) {
            overallCategory = 'Kinda liked it';
            overallColor = '#FFA500'; // Orange
        } else {
            overallCategory = 'Didn\'t like it';
            overallColor = '#FF0000'; // Red
        }

         // Draw "Overall Summary" title
         doc.setFontSize(16);
        doc.text('Overall Summary indicate that People "Check the Circle"', pageWidth / 2, yOffset, { align: 'center' });
        yOffset += 20;
         // Draw the circle with text
         const circleRadius = 15;
         const circleYCenter = yOffset + circleRadius;
         const circleXCenter = pageWidth / 2;

         doc.setFillColor(overallColor);
         doc.circle(circleXCenter, circleYCenter, circleRadius, 'F');
         doc.setTextColor('#FFFFFF');
         doc.setFontSize(14); // font size for text inside the circle

         // Calculate approximate text height (this is an approximation)
         const textHeight = doc.getFontSize() * 0.352777778; // 1 point = 0.352777778 mm

         // Adjust yOffset for text to be vertically centered within the circle
         const textY = circleYCenter + (textHeight / 2);

         doc.text(overallCategory, circleXCenter, textY, { align: 'center' }); // Center the text
         yOffset += 40;

        // text color 
        doc.setTextColor('#000000');
        doc.setFontSize(12); 

        // Interpretation Section
        if (includeSummary) {
            const interpretationText = document.querySelector('.interpretation-panel').innerText;
            const summaryLines = doc.splitTextToSize(interpretationText, pageWidth - 20);
            summaryLines.forEach(line => {
                if (yOffset + 10 > pageHeight) {
                    doc.addPage();
                    yOffset = 10;
                }
                doc.text(line, 10, yOffset);
                yOffset += 7;
            });
        }

        // Median Scores Section
        if (includeMedian) {
            if (yOffset + 20 > pageHeight) {
                doc.addPage();
                yOffset = 10;
            }
            yOffset += 10; 
            doc.text('Median Scores:', 10, yOffset);
            yOffset += 7;
            const medianScores = Object.entries(calculateMedianScores(convertedData)).map(([question, score]) => `${question}: ${score.toFixed(2)}`);
            medianScores.forEach(score => {
                if (yOffset + 10 > pageHeight) {
                    doc.addPage();
                    yOffset = 10;
                }
                doc.text(score, 10, yOffset);
                yOffset += 7;
            });
        }

        // Visualizations Section
        if (includeVisualizations) {
            if (yOffset + 110 > pageHeight) {
                doc.addPage();
                yOffset = 10;
            }
            yOffset += 10; 
            const chartIds = ['barChart', 'radarChart', 'lineChart', 'boxPlotChart', 'histogramChart', 'groupedBarChart'];
            for (let chartId of chartIds) {
                const chartCanvas = document.getElementById(chartId);
                if (chartCanvas) {
                    const chartDataUrl = chartCanvas.toDataURL('image/png');
                    doc.addImage(chartDataUrl, 'PNG', 10, yOffset, 180, 100); 
                    yOffset += 110; 
                    if (yOffset + 110 > pageHeight) {
                        doc.addPage();
                        yOffset = 10;
                    }
                    const chartDescription = getChartDescription(chartId);
                    const descriptionLines = doc.splitTextToSize(chartDescription, pageWidth - 20);
                    descriptionLines.forEach(line => {
                        if (yOffset + 10 > pageHeight) {
                            doc.addPage();
                            yOffset = 10;
                        }
                        doc.text(line, 10, yOffset);
                        yOffset += 7;
                    });
                }
            }
        }

        // Conclusion Section
        const conclusion = generateConclusion(susScores);
        if (conclusion) {
            if (yOffset + 20 > pageHeight) {
                doc.addPage();
                yOffset = 10;
            }
            yOffset += 10; 
            doc.text('Conclusion:', 10, yOffset);
            yOffset += 7;
            const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - 20);
            conclusionLines.forEach(line => {
                if (yOffset + 10 > pageHeight) {
                    doc.addPage();
                    yOffset = 10;
                }
                doc.text(line, 10, yOffset);
                yOffset += 7;
            });
        }

        doc.save('SUS_Report.pdf');
    }

    function getChartDescription(chartId) {
        switch (chartId) {
            case 'barChart':
                return `This bar chart displays the unique System Usability Scale (SUS) results for each user. The mean SUS score is ${average(susScores).toFixed(2)}. The maximum score is ${Math.max(...susScores).toFixed(2)}, while the minimum score is ${Math.min(...susScores).toFixed(2)}.`;
            case 'radarChart':
                const medianScores = calculateMedianScores(convertedData);
                return `This radar map illustrates the median results for each question. The medians for each question are as follows: ${Object.keys(medianScores).map(key => `${key} has a median of ${medianScores[key].toFixed(2)}`).join(', ')}.`;
            case 'lineChart':
                const avgScores = convertedData.map(user => average(Object.values(user)).toFixed(2)).join(', ');
                return `This line chart displays the scores for each user's queries. The mean scores of the users are: ${avgScores}.`;
            case 'boxPlotChart':
                return `This box plot chart displays the distribution of SUS scores. The mean score is ${average(susScores).toFixed(2)}, the median score is ${calculateMedian(susScores).toFixed(2)}, and the standard deviation is ${calculateStandardDeviation(susScores).toFixed(2)}.`;
            case 'histogramChart':
                const susScoreRanges = [
                    { range: '0-19', label: 'Worst Imaginable' },
                    { range: '20-39', label: 'Poor' },
                    { range: '40-59', label: 'OK' },
                    { range: '60-79', label: 'Good' },
                    { range: '80-100', label: 'Excellent/Best Imaginable' }
                ];
                const histogramDataWithLabels = susScoreRanges.map(item => {
                    const [min, max] = item.range.split('-').map(Number);
                    return susScores.filter(score => score >= min && score <= max).length;
                });
                return `This histogram displays the frequency distribution of SUS scores. The frequency of scores within each range are as follows: ${susScoreRanges.map((item, index) => `${item.range}: ${histogramDataWithLabels[index]}`).join(', ')}.`;
            case 'groupedBarChart':
                const positiveQuestions = ['Q1', 'Q3', 'Q5', 'Q7', 'Q9'];
                const negativeQuestions = ['Q2', 'Q4', 'Q6', 'Q8', 'Q10'];
                const positiveScores = positiveQuestions.map(q => average(convertedData.map(item => item[q])));
                const negativeScores = negativeQuestions.map(q => average(convertedData.map(item => item[q])));
                return `This bar chart displays the average scores of positive and negative questions in a grouped format for comparison. The mean scores for affirmative enquiries are ${positiveScores.map(score => score.toFixed(2)).join(', ')}. The mean scores for negative questions are: ${negativeScores.map(score => score.toFixed(2)).join(', ')}.`;
            default:
                return '';
        }
    }

    function generateConclusion(scores) {
        const averageScore = average(scores);
        const adjective = calculateAdjectiveRating(averageScore);

        return `The system's usability is assessed as "${adjective}" based on the average SUS score of ${averageScore.toFixed(2)}. This suggests that the overall user experience is ${adjective.toLowerCase()}.`;
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function calculateStandardDeviation(arr) {
        const avg = average(arr);
        const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    function calculateAdjectiveRating(score) {
        if (score >= 85) return 'Excellent/Best Imaginable';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Kinda liked it';
        if (score >= 35) return 'Poor';
        return 'Worst Imaginable';
    }

    function calculateMedianScores(data) {
        const medianScores = {};
        for (let i = 1; i <= 10; i++) {
            medianScores[`Q${i}`] = calculateMedian(data.map(item => item[`Q${i}`]));
        }
        return medianScores;
    }
});