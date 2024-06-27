document.addEventListener('DOMContentLoaded', () => {
    const radarChartCtx = document.getElementById('radarChart').getContext('2d');
    const barChartCtx = document.getElementById('barChart').getContext('2d');
    const lineChartCtx = document.getElementById('lineChart').getContext('2d');
    const susChartCtx = document.getElementById('doughnutChart').getContext('2d');
    const histogramChartCtx = document.getElementById('histogramChart').getContext('2d');
    const groupedBarChartCtx = document.getElementById('groupedBarChart').getContext('2d');

    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('processButton').addEventListener('click', processFile);
    document.getElementById('removeFileButton').addEventListener('click', removeFile);
    document.getElementById('resetButton').addEventListener('click', resetCharts);  // Add reset button event listener

    document.querySelector('.sidebar-list-item:nth-child(1)').addEventListener('click', () => showTab('chartsTab'));
    document.querySelector('.sidebar-list-item:nth-child(2)').addEventListener('click', () => showTab('dataTableTab'));

    let uploadedFile = null;
    let data = [];
    let convertedData = [];
    let susScores = [];
    let barChart, radarChart, lineChart, susChart, histogramChart, groupedBarChart;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
        document.body.addEventListener(eventName, preventDefaults, false)
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file && file.type === 'text/csv') {
                uploadedFile = file;
                document.getElementById('fileInfo').textContent = `File: ${file.name}`;
                document.getElementById('removeFileButton').style.display = 'block';
            } else {
                document.getElementById('fileInfo').textContent = "Please select a valid CSV file.";
                document.getElementById('removeFileButton').style.display = 'none';
                uploadedFile = null;
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
            document.getElementById('fileInfo').textContent = "Please select a valid CSV file.";
            document.getElementById('removeFileButton').style.display = 'none';
            uploadedFile = null;
        }
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

                convertedData = data.map(item => convertToAdjustedData(item));
                susScores = calculateSUSScores(convertedData);
                if (!susScores) {
                    alert("Error calculating SUS scores. Please check the data format.");
                    return;
                }

                updateDataTable(convertedData, susScores);
                renderCharts(convertedData, susScores);
                updateInterpretation(susScores);
                showTab('chartsTab');  // Show the charts tab after processing by default
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
        console.log("Updating data table with the following data:", data);
        console.log("SUS scores:", scores);

        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = ""; // Clear existing data
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

        // Calculate and add the average row
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
        if (barChart) barChart.destroy();
        if (radarChart) radarChart.destroy();
        if (lineChart) lineChart.destroy();
        if (susChart) susChart.destroy();
        if (histogramChart) histogramChart.destroy();
        if (groupedBarChart) groupedBarChart.destroy();

        barChart = renderBarChart(scores, data);
        radarChart = renderRadarChart(data);
        lineChart = renderLineChart(data);
        susChart = renderSusChart(scores);
        histogramChart = renderHistogram(scores);
        groupedBarChart = renderGroupedBarChart(data);
    }

    function renderBarChart(scores, data) {
        // Calculate the average scores per user
        const averageScores = data.map(user => {
            const questionScores = Object.values(user).map(val => val * 2.5);
            return average(questionScores);
        });

        return new Chart(barChartCtx, {
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
                            color: 'rgba(75, 192, 192, 0.2)',
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'User'
                        },
                        grid: {
                            color: 'rgba(75, 192, 192, 0.2)',
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
                    const activePoints = barChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
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

        return new Chart(radarChartCtx, {
            type: 'radar',
            data: {
                labels: Object.keys(averageScores),
                datasets: [{
                    label: 'Average Score',
                    data: Object.values(averageScores),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 5,
                        title: {
                            display: true,
                            text: 'Average Score'
                        }
                    }
                }
            }
        });
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

        return new Chart(lineChartCtx, {
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
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    }
                }
            }
        });
    }

    function renderSusChart(scores) {
        const susScoreRanges = ['Worst Imaginable', 'Poor', 'OK', 'Good', 'Excellent', 'Best Imaginable'];
        const susScoresCount = [0, 0, 0, 0, 0, 0];

        scores.forEach(score => {
            if (score < 25) susScoresCount[0]++;
            else if (score < 50) susScoresCount[1]++;
            else if (score < 70) susScoresCount[2]++;
            else if (score < 85) susScoresCount[3]++;
            else if (score < 100) susScoresCount[4]++;
            else susScoresCount[5]++;
        });

        return new Chart(susChartCtx, {
            type: 'bar',
            data: {
                labels: susScoreRanges,
                datasets: [{
                    label: 'Number of Scores',
                    data: susScoresCount,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
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
                            text: 'Number of Scores'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'SUS Score Range'
                        }
                    }
                }
            }
        });
    }

    function renderHistogram(scores) {
        const bins = Array.from({ length: 11 }, (_, i) => i * 10);
        const histogramData = bins.map(bin => scores.filter(score => score >= bin && score < bin + 10).length);

        return new Chart(histogramChartCtx, {
            type: 'bar',
            data: {
                labels: bins.map(bin => `${bin}-${bin + 9}`),
                datasets: [{
                    label: 'SUS Score Distribution',
                    data: histogramData,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
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
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'SUS Score Range'
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

        return new Chart(groupedBarChartCtx, {
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
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Question'
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
            <p>Adjective Rating: ${adjective}</p>
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
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'OK';
        if (score >= 35) return 'Poor';
        return 'Awful';
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

    function removeFile() {
        document.getElementById('fileInput').value = ""; // Clear file input
        document.getElementById('fileInfo').textContent = ""; // Clear file info
        document.getElementById('removeFileButton').style.display = 'none'; // Hide remove button
        uploadedFile = null; // Reset the uploadedFile variable
    }

    function showTab(tabId) {
        console.log(`Showing tab: ${tabId}`);
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            if (tab.id === tabId) {
                tab.style.display = 'block';
                console.log(`Displaying tab: ${tabId}`);
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
        console.log("Checking table data, rows count:", tbody.rows.length);
        if (tbody.rows.length === 0) {
            noDataMessage.style.display = 'block';
            console.log("No data available.");
        } else {
            noDataMessage.style.display = 'none';
            console.log("Data table populated.");
        }
    }

    // Accordion functionality
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            const content = button.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    });

    // Show the charts tab by default
    showTab('chartsTab');

    // Download functionality for charts
    document.getElementById('downloadBarChartBtn').addEventListener('click', () => downloadChart('barChart', 'IndividualSUSScores.png'));
    document.getElementById('downloadRadarChartBtn').addEventListener('click', () => downloadChart('radarChart', 'AverageScoresPerQuestion.png'));
    document.getElementById('downloadLineChartBtn').addEventListener('click', () => downloadChart('lineChart', 'ScoresAcrossQuestions.png'));
    document.getElementById('downloadDoughnutChartBtn').addEventListener('click', () => downloadChart('doughnutChart', 'SUSScoring.png'));
    document.getElementById('downloadHistogramChartBtn').addEventListener('click', () => downloadChart('histogramChart', 'SUSScoreDistribution.png'));
    document.getElementById('downloadGroupedBarChartBtn').addEventListener('click', () => downloadChart('groupedBarChart', 'PositiveVsNegativeQuestions.png'));
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadCSV);

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

    // Filtering functions
    function filterDataByUser(userIndex) {
        const filteredData = data.filter((_, index) => index === userIndex - 1);
        const filteredScores = susScores.filter((_, index) => index === userIndex - 1);
        renderCharts(filteredData, filteredScores);
    }

    function filterDataByRating(rating) {
        const filteredData = data.filter((_, index) => calculateAdjectiveRating(susScores[index]) === rating);
        const filteredScores = susScores.filter(score => calculateAdjectiveRating(score) === rating);
        renderCharts(filteredData, filteredScores);
    }

    // Reset charts to show all data
    function resetCharts() {
        renderCharts(convertedData, susScores);
    }
});
