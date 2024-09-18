import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { ArlangAstType, SwComponent, Port } from './generated/ast.js';
import type { ArlangServices } from './arlang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ArlangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ArlangValidator;
    const checks: ValidationChecks<ArlangAstType> = {
        SwComponent : validator.checkSwcPortsDuplicateNames
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ArlangValidator {

    checkSwcPortsDuplicateNames(swc : SwComponent, accept: ValidationAcceptor): void {
        const portNames = new Map<string, Port>
        const duplicatePorts : Port[] = [];

        for (const port of swc.ports) {
            const portName = port.name

            const portWithSameName = portNames.get(portName);
            if (portWithSameName !== undefined) {
                duplicatePorts.push(port);
            } else {
                portNames.set(portName, port);
            }
        }

        duplicatePorts.forEach(port => {
            accept('error', `Duplication port name "${port.name}" inside SwComponent "${swc.name}"`, {node: port, property: 'name'});
        });
    }

}
