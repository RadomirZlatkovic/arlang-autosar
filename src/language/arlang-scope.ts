import {
    AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument, MultiMap, PrecomputedScopes
} from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import type { ArlangServices } from './arlang-module.js';
import { Model } from './generated/ast.js';

export class ArlangScopeComputation extends DefaultScopeComputation {

    constructor(services: ArlangServices) {
        super(services);
    }

    /**
     * Export elements with package prefix.
     * Elements from other files will be referencable with their full package name as prefix to their actual name.
     * (e.g. interface IMyInterface from p1.p2 package will be referencable with p1.p2.IMyInterface)
     */
    override async computeExports(document: LangiumDocument<AstNode>, cancelToken = CancellationToken.None): Promise<AstNodeDescription[]> {
        const descr: AstNodeDescription[] = [];

        const model : Model = document.parseResult.value as Model;

        model.packages.forEach((arPackage) => {
            const packageName : string | undefined = this.nameProvider.getName(arPackage);
            if (packageName !== undefined) {

                arPackage.elements.forEach((element) => {
                    const elementName : string | undefined = this.nameProvider.getName(element);
                    if (elementName !== undefined) {
                        descr.push(this.descriptions.createDescription(element, packageName + "." + elementName, document));
                    }
                });

            }
        });

        return descr;
    }

    /**
     * Elements in the same document can reference each other without specifying package they belong to.
     * Parsed document value is represented by 'Model' node.
     * Descriptions should be created for all elements with their actual names
     * and those descriptions should be added in map for key represented my 'Model' node.
     */
    override async computeLocalScopes(document: LangiumDocument<AstNode>, cancelToken = CancellationToken.None): Promise<PrecomputedScopes> {
        const scopes = new MultiMap<AstNode, AstNodeDescription>();

        const model = document.parseResult.value as Model;

        model.packages.forEach((arPackage) => {
            arPackage.elements.forEach((element) => {
                const scopeName : string | undefined = this.nameProvider.getName(element);
                if (scopeName !== undefined) {
                    scopes.add(model, this.descriptions.createDescription(element, scopeName, document));
                }
            });
        });

        return scopes;
    }

}
