document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const radarChart = document.getElementById('radarChart');
    const barChart = document.getElementById('barChart');
    const scoreDistribution = document.getElementById('scoreDistribution');
    const interpretationPanel = document.getElementById('interpretationPanel');
    const dataTable = document.getElementById('dataTable');
    const downloadButton = document.getElementById('downloadButton');
    const chartsTab = document.getElementById('chartsTab');
    const tableTab = document.getElementById('tableTab');
    const chartSection = document.getElementById('chartSection');
    const tableSection = document.getElementById('tableSection');

    chartsTab.addEventListener('click', () => {
        chartSection.style.display = 'block';
        tableSection.style.display = 'none';
    });

    tableTab.addEventListener('click', () => {
        chartSection.style.display = 'none';
        tableSection.style.display = 'block';
    });

    processButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: function (results) {
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

                    const averages = calculateAverages(susData);
                    renderRadarChart(averages);
                    renderBarChart(susData);
                    renderScoreDistribution(susData);
                    renderInterpretationPanel(averages);
                }
            });
        }
    });

    function calculateAverages(data) {
        const totals = data.reduce((acc, row) => {
            for (const key in row) {
                acc[key] = (acc[key] || 0) + row[key];
            }
            return acc;
        }, {});

        const averages = {};
        for (const key in totals) {
            averages[key] = totals[key] / data.length;
        }
        return averages;
    }

    function renderRadarChart(averages) {
        const spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: {
                values: Object.keys(averages).map(key => ({ question: key, average: averages[key] }))
            },
            mark: 'line',
            encoding: {
                theta: { field: 'question', type: 'nominal' },
                radius: { field: 'average', type: 'quantitative' }
            }
        };
        vegaEmbed('#radarChart', spec);
    }

    function renderBarChart(data) {
        const spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: {
                values: data
            },
            mark: 'bar',
            encoding: {
                x: { field: 'question', type: 'nominal' },
                y: { field: 'average', type: 'quantitative' }
            }
        };
        vegaEmbed('#barChart', spec);
    }

    function renderScoreDistribution(data) {
        // Your implementation here
    }

    function renderInterpretationPanel(averages) {
        const averageScore = Object.values(averages).reduce((a, b) => a + b, 0) / Object.values(averages).length;
        interpretationPanel.innerHTML = `
            <h3>SUS - Average Score: ${averageScore.toFixed(2)}</h3>
            <p>The average SUS score is ${averageScore.toFixed(2)}.</p>
            <p>A score above 68 is considered above average, while a score below 68 is considered below average.</p>
            <h4>Score Ranges:</h4>
            <ul>
                <li>0-25: Poor</li>
                <li>26-50: OK</li>
                <li>51-75: Good</li>
                <li>76-100: Excellent</li>
            </ul>
            <h4>Percentiles:</h4>
            <ul>
                <li>Top 10%: Excellent</li>
                <li>Top 30%: Good</li>
                <li>Bottom 30%: OK</li>
                <li>Bottom 10%: Poor</li>
            </ul>
        `;
    }

    downloadButton.addEventListener('click', () => {
        // Your implementation here
    });
});
