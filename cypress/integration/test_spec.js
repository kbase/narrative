describe('Navigate to a narrative', () => {
    const user_token = Cypress.env('dev_user_token')

    it('visits the narrative tree', () => {
        cy.visit('http://localhost:8888/narrative/tree');
    })

    it('sets the user token', () => {
        cy.get('.form-control').type(user_token);
        cy.contains('OK').click();
        cy.getCookie('kbase_session').should('have.property', 'value', user_token);
    })

    it('opens a narrative', () => {
        cy.get('.form-control').type(user_token);
        cy.contains('OK').click();

        // Cypress doesn't navigate multiple tabs, so open the new page in the same tab.
        cy.contains('Prokka6').should('be.visible').invoke('removeAttr', 'target').click();
        cy.get('nav[id="header"]').should('be.visible');
    })
})