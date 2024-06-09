document.addEventListener('DOMContentLoaded', () => {
    const radarChartCtx = document.getElementById('radarChart').getContext('2d');
    const barChartCtx = document.getElementById('barChart').getContext('2d');
    const lineChartCtx = document.getElementById('lineChart').getContext('2d');
    const doughnutChartCtx = document.getElementById('doughnutChart').getContext('2d');
    const histogramChartCtx = document.getElementById('histogramChart').getContext('2d');
    const groupedBarChartCtx = document.getElementById('groupedBarChart').getContext('2d');

    console.log("DOM fully loaded and parsed");

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('processButton').addEventListener('click', processFile);

    let uploadedFile = null;

    /**
     * Handles file upload and updates UI accordingly
     * @param {Event} event - The file upload event
     */
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            uploadedFile = file;
            document.getElementById('fileInfo').textContent = `File: ${file.name}`;
            document.getElementById('removeFileButton').style.display = 'block';
            console.log("File selected:", file.name);
        } else {
            document.getElementById('fileInfo').textContent = "Please select a valid CSV file.";
            document.getElementById('removeFileButton').style.display = 'none';
            console.log("Invalid file selected.");
        }
    }

    /**
     * Processes the uploaded CSV file and updates charts and interpretation panel
     */
    function processFile() {
        if (uploadedFile) {
            Papa.parse(uploadedFile, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    if (results.errors.length) {
                        console.error("Error parsing file:", results.errors);
                        alert("Error parsing file. Please check the CSV format.");
                        return;
                    }
                    const data = results.data;
                    console.log("Parsed data:", data);
                    const scores = calculateSUSScores(data);
                    console.log("Scores calculated:", scores);
                    updateDataTable(data, scores);
                    renderCharts(data, scores);
                    updateInterpretation(scores);
                },
                error: function(error) {
                    console.error("Error parsing file:", error);
                    alert("Error parsing file. Please try again.");
                }
            });
        } else {
            alert("Please upload a CSV file first.");
        }
    }

    /**
     * Calculates SUS scores from the parsed CSV data
     * @param {Array} data - The parsed CSV data
     * @returns {Array} - Array of SUS scores
     */
    function calculateSUSScores(data) {
        return data.map(item => {
            const positiveScores = (item.Q1 - 1) + (item.Q3 - 1) + (item.Q5 - 1) + (item.Q7 - 1) + (item.Q9 - 1);
            const negativeScores = (5 - item.Q2) + (5 - item.Q4) + (5 - item.Q6) + (5 - item.Q8) + (5 - item.Q10);
            return (positiveScores + negativeScores) * 2.5;
        });
    }

    /**
     * Updates the data table with the parsed CSV data and calculated SUS scores
     * @param {Array} data - The parsed CSV data
     * @param {Array} scores - The calculated SUS scores
     */
    function updateDataTable(data, scores) {
        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = ""; // Clear existing data
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            const userCell = document.createElement('td');
            userCell.textContent = `User ${index + 1}`;
            tr.appendChild(userCell);

            for (let i = 1; i <= 10; i++) {
                const cell = document.createElement('td');
                cell.textContent = row[`Q${i}`];
                tr.appendChild(cell);
            }

            const scoreCell = document.createElement('td');
            scoreCell.textContent = scores[index];
            tr.appendChild(scoreCell);

            tbody.appendChild(tr);
        });
    }

    /**
     * Renders all charts with the parsed data and calculated scores
     * @param {Array} data - The parsed CSV data
     * @param {Array} scores - The calculated SUS scores
     */
    function renderCharts(data, scores) {
        renderBarChart(scores);
        renderRadarChart(data);
        renderLineChart(data);
        renderDoughnutChart(scores);
        renderHistogram(scores);
        renderGroupedBarChart(data);
    }

    /**
     * Renders a bar chart with the SUS scores
     * @param {Array} scores - The calculated SUS scores
     */
    function renderBarChart(scores) {
        new Chart(barChartCtx, {
            type: 'bar',
            data: {
                labels: scores.map((_, index) => `User ${index + 1}`),
                datasets: [{
                    label: 'SUS Score',
                    data: scores,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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
                            text: 'SUS Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'User'
                        }
                    }
                }
            }
        });
    }

    /**
     * Renders a radar chart with the average scores per question
     * @param {Array} data - The parsed CSV data
     */
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

        new Chart(radarChartCtx, {
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

    /**
     * Renders a line chart with the scores across questions for each user
     * @param {Array} data - The parsed CSV data
     */
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

        new Chart(lineChartCtx, {
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

    /**
     * Renders a doughnut chart with the adjective ratings
     * @param {Array} scores - The calculated SUS scores
     */
    function renderDoughnutChart(scores) {
        const adjectiveRatings = scores.map(score => calculateAdjectiveRating(score));
        const ratingCounts = {
            Excellent: adjectiveRatings.filter(r => r === 'Excellent').length,
            Good: adjectiveRatings.filter(r => r === 'Good').length,
            OK: adjectiveRatings.filter(r => r === 'OK').length,
            Poor: adjectiveRatings.filter(r => r === 'Poor').length,
            Awful: adjectiveRatings.filter(r => r === 'Awful').length
        };

        new Chart(doughnutChartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(ratingCounts),
                datasets: [{
                    label: 'Adjective Ratings',
                    data: Object.values(ratingCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.label}: ${tooltipItem.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Renders a histogram with the SUS scores
     * @param {Array} scores - The calculated SUS scores
     */
    function renderHistogram(scores) {
        const bins = Array.from({ length: 11 }, (_, i) => i * 10);
        const histogramData = bins.map(bin => scores.filter(score => score >= bin && score < bin + 10).length);

        new Chart(histogramChartCtx, {
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

    /**
     * Renders a grouped bar chart with positive and negative question scores
     * @param {Array} data - The parsed CSV data
     */
    function renderGroupedBarChart(data) {
        const positiveQuestions = ['Q1', 'Q3', 'Q5', 'Q7', 'Q9'];
        const negativeQuestions = ['Q2', 'Q4', 'Q6', 'Q8', 'Q10'];

        const positiveScores = positiveQuestions.map(q => average(data.map(item => item[q])));
        const negativeScores = negativeQuestions.map(q => average(data.map(item => item[q])));

        new Chart(groupedBarChartCtx, {
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

    /**
     * Calculates the average value of an array
     * @param {Array} arr - The array of numbers
     * @returns {Number} - The average value
     */
    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    /**
     * Updates the interpretation panel with calculated statistics
     * @param {Array} scores - The calculated SUS scores
     */
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

    /**
     * Calculates the median of an array
     * @param {Array} arr - The array of numbers
     * @returns {Number} - The median value
     */
    function calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    /**
     * Calculates the standard deviation of an array
     * @param {Array} arr - The array of numbers
     * @returns {Number} - The standard deviation
     */
    function calculateStandardDeviation(arr) {
        const avg = average(arr);
        const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * Calculates the adjective rating based on the SUS score
     * @param {Number} score - The SUS score
     * @returns {String} - The adjective rating
     */
    function calculateAdjectiveRating(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'OK';
        if (score >= 35) return 'Poor';
        return 'Awful';
    }

    /**
     * Calculates the grade based on the SUS score
     * @param {Number} score - The SUS score
     * @returns {String} - The grade
     */
    function calculateGrade(score) {
        if (score >= 85) return 'A';
        if (score >= 70) return 'B';
        if (score >= 50) return 'C';
        if (score >= 35) return 'D';
        return 'F';
    }

    /**
     * Calculates the acceptability based on the SUS score
     * @param {Number} score - The SUS score
     * @returns {String} - The acceptability
     */
    function calculateAcceptability(score) {
        if (score >= 70) return 'Acceptable';
        if (score >= 50) return 'Marginal';
        return 'Not Acceptable';
    }

    /**
     * Removes the uploaded file and resets the UI
     */
    function removeFile() {
        document.getElementById('fileInput').value = "";
        document.getElementById('fileInfo').textContent = "";
        document.getElementById('removeFileButton').style.display = 'none';
        uploadedFile = null;
    }
});
