import {
  DataObject,
  DefaultCrudRepository,
  ensurePromise,
  Entity,
  EntityNotFoundError,
  Filter,
  Options,
  juggler,
  Model,
  PropertyType,
  resolveType,
  isTypeResolver,
} from "@loopback/repository";
import { Request, RequestContext } from "@loopback/rest";
import { DomainRepository } from "./repositories/domain.repository";
import { Domain } from "./models/domain.model";

export class MultiRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {
  /**
   * Constructor of DefaultCrudRepository
   * @param entityClass - LoopBack 4 entity class
   * @param dataSource - Legacy juggler data source
   */
  constructor(
    // EntityClass should have type "typeof T", but that's not supported by TSC
    public entityClass: typeof Entity & { prototype: T },
    public dataSource: juggler.DataSource,
    public request: Request,
    public context: RequestContext,
    public domainRepository: DomainRepository
  ) {
    super(entityClass, dataSource)
  }

  private _getModelName(name: string) {
    return name + '_app_' + this.request?.hostname?.replace(/\./g,'_');
  }

  // Create an internal legacy Model attached to the datasource
  // This is specific to the domain for multi-repository
  private async _getModel(
    entityClass: typeof Model,
  ): Promise<typeof juggler.PersistedModel> {
    const definition = entityClass.definition;

    const dataSource = this.dataSource;

    const modelName = this._getModelName(definition.name);

    const model = dataSource.getModel(modelName) ;
    if (model && typeof (model as any).find === 'function') {
      // The backing persisted model has been already defined.
      return model as typeof juggler.PersistedModel;
    }

    return await this._definePersistedModelMulti(entityClass);
  }

  /**
   * Creates a legacy persisted model class, attaches it to the datasource and
   * returns it. This method can be overridden in sub-classes to acess methods
   * and properties in the generated model class.
   * @param entityClass - LB4 Entity constructor
   */
  private async _definePersistedModelMulti(
    entityClass: typeof Model,
  ): Promise<typeof juggler.PersistedModel> {
    const dataSource = this.dataSource;
    const definition = entityClass.definition;
    const modelName = this._getModelName(definition.name);

    // To handle circular reference back to the same model,
    // we create a placeholder model that will be replaced by real one later
    dataSource.getModel(modelName, true /* forceCreate */);

    // We need to convert property definitions from PropertyDefinition
    // to plain data object because of a juggler limitation
    const properties: {[name: string]: object} = {};

    // We need to convert PropertyDefinition into the definition that
    // the juggler understands
    Object.entries(definition.properties).forEach(([key, value]) => {
      // always clone value so that we do not modify the original model definition
      // ensures that model definitions can be reused with multiple datasources
      if (value.type === 'array' || value.type === Array) {
        value = Object.assign({}, value, {
          type: [value.itemType && this._resolvePropertyTypeMulti(value.itemType)],
        });
        delete value.itemType;
      } else {
        value = Object.assign({}, value, {
          type: this._resolvePropertyTypeMulti(value.type),
        });
      }
      properties[key] = Object.assign({}, value);
    });

    const multiOptions = await this._getMultiOptions(this.request?.hostname);

    const settings = { ...definition.settings, ...multiOptions };

    const modelClass = dataSource.createModel<juggler.PersistedModelClass>(
      modelName,
      properties,
      Object.assign(
        // settings that users can override
        {strict: true},
        // user-defined settings
        settings,
        // settings enforced by the framework
        {strictDelete: false},
      ),
    );
    modelClass.attachTo(dataSource);
    return modelClass;
  }

  private _resolvePropertyTypeMulti(type: PropertyType): PropertyType {
    const resolved = resolveType(type);
    return isModelClass(resolved)
      ? this._getModel(resolved)
      : resolved;
  }

  async find(
    filter?: Filter<T>,
    options?: Options,
  ): Promise<(T & Relations)[]> {
    const include = filter?.include;
    const currentModel = await this._getModel(this.entityClass);
    const models = await ensurePromise(
      currentModel.find(this.normalizeFilter(filter), options),
    );
    const entities = this.toEntities(models);
    return this.includeRelatedModels(entities, include, options);
  }


  async create(entity: DataObject<T>, options?: Options): Promise<T> {
    const currentModel = await this._getModel(this.entityClass);
    // perform persist hook
    const data = await this.entityToData(entity, options);
    const model = await ensurePromise(currentModel.create(data, options));
    return this.toEntity(model);
  }

  // async find(
  //   filter?: Filter<T>,
  //   options?: Options
  // ): Promise<(T & Relations)[]> {
  //   const multiOptions = await this._getMultiOptions(this.request?.hostname);

  //   console.log("in multi-repository find");
  //   console.log({ ...options, ...multiOptions });

  //   return super.find(filter, { ...options, ...multiOptions });
  // }

  // async create(entity: DataObject<T>, options?: Options): Promise<T> {
  //   const multiOptions = await this._getMultiOptions(this.request?.hostname);

  //   console.log("in multi-repository create");
  //   console.log({ ...options, ...multiOptions });

  //   return super.create(entity, { ...options, ...multiOptions });
  // }

  async _getMultiOptions(hostname: string) {
    let domain: Domain | undefined;
    let database: string | undefined;

    domain = hostname
      ? await this?.domainRepository?.findById(hostname)
      : undefined;

    database = domain?.database;

    if (!database) {
      throw new EntityNotFoundError(Domain, hostname);
    }

    const collection =
      this.entityClass?.name;

    return {
      mongodb: {
        collection,
        database,
      },
    };
  }
}

function isModelClass(
  propertyType: PropertyType | undefined,
): propertyType is typeof Model {
  return (
    !isTypeResolver(propertyType) &&
    typeof propertyType === 'function' &&
    typeof (propertyType as typeof Model).definition === 'object' &&
    propertyType.toString().startsWith('class ')
  );
}
