document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('drop-area');
    const processButton = document.getElementById('processButton');
    const barChartDiv = document.getElementById('barChart');
    const radarChartDiv = document.getElementById('radarChart');
    const dataTable = document.getElementById('dataTable');
    let susData = []; // Global variable to store SUS data
    let scores = []; // Global variable to store SUS scores

    initializeEventListeners();

    function initializeEventListeners() {
        dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('dragleave', handleDragLeave);
        dropArea.addEventListener('drop', handleFileDrop);
        processButton.addEventListener('click', handleFileProcess);
        document.getElementById('downloadButton').addEventListener('click', handleDownload);
    }

    function handleDragOver(event) {
        event.preventDefault();
        dropArea.classList.add('dragover');
    }

    function handleDragLeave() {
        dropArea.classList.remove('dragover');
    }

    function handleFileDrop(event) {
        event.preventDefault();
        dropArea.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
        }
    }

    function handleFileProcess() {
        const file = fileInput.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    try {
                        susData = parseSUSData(results.data);
                        scores = calculateSUSScores(susData);
                        renderBarChart(scores);
                        renderRadarChart(susData);
                        renderTable(susData, scores);
                    } catch (error) {
                        alert('Error processing the file: ' + error.message);
                    }
                }
            });
        } else {
            alert('Please select a file to process.');
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

        vegaEmbed('#barChart', barChartSpec).catch(console.error);
    }

    function renderRadarChart(data) {
        const averageScores = calculateAverageScores(data);
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

    function calculateAverageScores(data) {
        return {
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
    }

    function renderTable(data, scores) {
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
        `;
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function handleDownload() {
        const csvContent = generateCSV(susData, scores);
        downloadCSV(csvContent, 'processed_data.csv');
    }

    function generateCSV(data, scores) {
        const headers = ['User', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'SUS Score'];
        const rows = data.map((row, index) => [
            `User ${index + 1}`, row.Q1, row.Q2, row.Q3, row.Q4, row.Q5, row.Q6, row.Q7, row.Q8, row.Q9, row.Q10, scores[index]
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
});
