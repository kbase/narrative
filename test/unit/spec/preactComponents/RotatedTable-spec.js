define(['preact', 'htm', 'preactComponents/RotatedTable', './utils'], (
    preact,
    htm,
    RotatedTable,
    utils
) => {
    'use strict';

    const { h } = preact;
    const html = htm.bind(h);

    const { createBodyElement } = utils;

    describe('The RotatedTable preact component', () => {
        it('should render a simple table with text cells', () => {
            const container = createBodyElement();
            const content = html`
                <${RotatedTable.Table}>
                    <${RotatedTable.Row}>
                        <${RotatedTable.HeaderCell}> HEADER CELL </${RotatedTable.HeaderCell}>
                        <${RotatedTable.DisplayCell}> DISPLAY CELL </${RotatedTable.DisplayCell}>
                    </${RotatedTable.Row}>
                </${RotatedTable.Table}>
            `;
            preact.render(content, container);

            expect(container.innerText).toContain('HEADER CELL');
            expect(container.innerText).toContain('DISPLAY CELL');

            container.remove();
        });

        it('should render a simple table with component cells', () => {
            const container = createBodyElement();
            const content = html`
                <${RotatedTable.Table}>
                    <${RotatedTable.Row}>
                        <${RotatedTable.HeaderCell}>
                            <span>ALSO A HEADER CELL</span>
                        </${RotatedTable.HeaderCell}>
                        <${RotatedTable.DisplayCell}>
                            <bold>YES THIS IS A DISPLAY CELL</bold>
                        </${RotatedTable.DisplayCell}>
                    </${RotatedTable.Row}>
                </${RotatedTable.Table}>
            `;
            preact.render(content, container);

            expect(container.innerText).toContain('ALSO A HEADER CELL');
            expect(container.innerText).toContain('YES THIS IS A DISPLAY CELL');

            container.remove();
        });

        it('should render a large table', () => {
            const container = createBodyElement();
            const expected = [];
            const rows = [];
            for (let i = 0; i < 100; i += 1) {
                const headerText = `HEADER ${i}`;
                const displayText = `DISPLAY ${i}`;
                expected.push([headerText, displayText]);
                rows.push(html`
                    <${RotatedTable.Row} row-key=${String(i)}>
                        <${RotatedTable.HeaderCell}> ${headerText} </${RotatedTable.HeaderCell}>
                        <${RotatedTable.DisplayCell}> ${displayText} </${RotatedTable.DisplayCell}>
                    </${RotatedTable.Row}>
                `);
            }

            const content = html`
                <${RotatedTable.Table}>
                    <${RotatedTable.Row}> ${rows} </${RotatedTable.Row}>
                </${RotatedTable.Table}>
            `;
            preact.render(content, container);

            for (const [headerText, displayText] of expected) {
                expect(container.innerText).toContain(headerText);
                expect(container.innerText).toContain(displayText);
            }

            for (let i = 0; i < 100; i += 1) {
                const headerText = `HEADER ${i}`;
                const displayText = `DISPLAY ${i}`;
                const row = container.querySelector(`[data-row-key="${i}"]`);
                expect(row).not.toBeNull();
                expect(row.innerText).toContain(headerText);
                expect(row.innerText).toContain(displayText);
            }

            container.remove();
        });

        it('should render a simple table without row keys', () => {
            const container1 = createBodyElement();
            const content1 = html`
                <${RotatedTable.Table}>
                    <${RotatedTable.Row} row-key="foo">
                        <${RotatedTable.HeaderCell}> HEADER CELL </${RotatedTable.HeaderCell}>
                        <${RotatedTable.DisplayCell}> DISPLAY CELL </${RotatedTable.DisplayCell}>
                    </${RotatedTable.Row}>
                </${RotatedTable.Table}>
            `;
            preact.render(content1, container1);

            const row = container1.querySelector('[data-row-key="foo"]');
            expect(row).not.toBeNull();
            expect(row.innerText).toContain('HEADER CELL');
            expect(row.innerText).toContain('DISPLAY CELL');

            // But now, without a row key...
            const container2 = createBodyElement();
            const content2 = html`
                <${RotatedTable.Table}>
                    <${RotatedTable.Row}>
                        <${RotatedTable.HeaderCell}> HEADER CELL </${RotatedTable.HeaderCell}>
                        <${RotatedTable.DisplayCell}> DISPLAY CELL </${RotatedTable.DisplayCell}>
                    </${RotatedTable.Row}>
                </${RotatedTable.Table}>
            `;
            preact.render(content2, container2);
            expect(row).not.toBeNull();
            expect(container2.innerText).toContain('HEADER CELL');
            expect(container2.innerText).toContain('DISPLAY CELL');

            container1.remove();
            container2.remove();
        });
    });
});
