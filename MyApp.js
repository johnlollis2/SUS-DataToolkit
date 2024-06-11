document.addEventListener('DOMContentLoaded', () => {
    const radarChartCtx = document.getElementById('radarChart').getContext('2d');
    const barChartCtx = document.getElementById('barChart').getContext('2d');
    const lineChartCtx = document.getElementById('lineChart').getContext('2d');
    const doughnutChartCtx = document.getElementById('doughnutChart').getContext('2d');
    const histogramChartCtx = document.getElementById('histogramChart').getContext('2d');
    const groupedBarChartCtx = document.getElementById('groupedBarChart').getContext('2d');

    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const sidebar = document.getElementById('sidebar');
    const menuIcon = document.querySelector('.menu-icon');

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('processButton').addEventListener('click', processFile);
    document.getElementById('removeFileButton').addEventListener('click', removeFile);

    document.querySelector('.sidebar-list-item:nth-child(1)').addEventListener('click', () => {
        showTab('chartsTab');
        closeSidebarOnMobile();
    });
    document.querySelector('.sidebar-list-item:nth-child(2)').addEventListener('click', () => {
        showTab('dataTableTab');
        closeSidebarOnMobile();
    });

    menuIcon.addEventListener('click', toggleSidebar);

    let uploadedFile = null;

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

                const data = results.data;
                if (!data || data.length === 0) {
                    alert("CSV file is empty or not properly formatted.");
                    return;
                }

                const scores = calculateSUSScores(data);
                if (!scores) {
                    alert("Error calculating SUS scores. Please check the data format.");
                    return;
                }

                updateDataTable(data, scores);
                renderCharts(data, scores);
                updateInterpretation(scores);
                showTab('chartsTab');  // Show the charts tab after processing by default
            },
            error: function(error) {
                console.error("Error parsing file:", error);
                alert("Error parsing file. Please try again.");
            }
        });
    }

    function calculateSUSScores(data) {
        try {
            return data.map(item => {
                if (typeof item.Q1 !== 'number' || typeof item.Q2 !== 'number' || typeof item.Q3 !== 'number' ||
                    typeof item.Q4 !== 'number' || typeof item.Q5 !== 'number' || typeof item.Q6 !== 'number' ||
                    typeof item.Q7 !== 'number' || typeof item.Q8 !== 'number' || typeof item.Q9 !== 'number' ||
                    typeof item.Q10 !== 'number') {
                    throw new Error("Invalid data format");
                }

                const positiveScores = (item.Q1 - 1) + (item.Q3 - 1) + (item.Q5 - 1) + (item.Q7 - 1) + (item.Q9 - 1);
                const negativeScores = (5 - item.Q2) + (5 - item.Q4) + (5 - item.Q6) + (5 - item.Q8) + (5 - item.Q10);
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
                cell.textContent = row[`Q${i}`];
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
            const avgScore = average(data.map(item => item[`Q${i}`]));
            const cell = document.createElement('td');
            cell.textContent = avgScore.toFixed(2);
            tr.appendChild(cell);
        }

        const avgSUSScore = average(scores);
        const avgSUSCell = document.createElement('td');
        avgSUSCell.textContent = avgSUSScore.toFixed(2);
        tr.appendChild(avgSUSCell);

        tbody.appendChild(tr);
    }

    function renderCharts(data, scores) {
        renderBarChart(scores);
        renderRadarChart(data);
        renderLineChart(data);
        renderDoughnutChart(scores);
        renderHistogram(scores);
        renderGroupedBarChart(data);
    }

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

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-closed');
    }

    function closeSidebarOnMobile() {
        if (window.innerWidth <= 992) {
            sidebar.classList.add('sidebar-closed');
        }
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
});
